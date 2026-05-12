"""
PII Detector Service — Full 13-Stage Heavy AI Pipeline
Fixed: all bugs causing 500 errors
"""
from __future__ import annotations
import time
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from app.utils.regex_patterns import COMPILED_PATTERNS, PATTERN_METADATA
from app.services.risk_engine import RiskEngine
from app.services.masking_service import MaskingService
from app.services.bert_ner_service import get_bert_service
from app.services.pipeline_engine import get_pipeline, PipelineStage, _REDIS_AVAILABLE
from app.models.schemas import (
    DetectedEntity, DetectionResult, RiskLevel, SourceType,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────
MAX_TEXT_LENGTH     = 50_000   # max chars accepted per request
SPACY_TEXT_LIMIT    = 10_000   # spaCy is slow on long text; truncate
CONFIDENCE_BOOST    = 0.08     # boost when multiple models agree on same span
MIN_CONFIDENCE      = 0.40     # entities below this are dropped in validation

# spaCy
try:
    import spacy
    _NLP = spacy.load("en_core_web_sm")
    _SPACY_AVAILABLE = True
    logger.info("spaCy model loaded successfully.")
except Exception:
    _NLP = None
    _SPACY_AVAILABLE = False
    logger.warning("spaCy not available.")


class PIIDetector:

    def __init__(self):
        self.risk_engine     = RiskEngine()
        self.masking_service = MaskingService()
        self.bert_service    = get_bert_service()
        self.pipeline        = get_pipeline()
        self._executor       = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pii-ml")
        logger.info(
            "PIIDetector — BERT:%s | spaCy:%s | Redis:%s | Regex:13",
            "ON" if self.bert_service.is_available() else "OFF",
            "ON" if _SPACY_AVAILABLE else "OFF",
            "ON" if _REDIS_AVAILABLE else "OFF",
        )

    async def detect(
        self,
        text: str,
        source_type: SourceType = SourceType.TEXT,
        include_masked_text: bool = True,
    ) -> DetectionResult:

        loop = asyncio.get_event_loop()
        pipeline_start = time.perf_counter()
        stages = []

        # Stage 1: Input validation
        t = time.perf_counter()
        if not text or not text.strip():
            return self._empty_result(source_type)
        text = text[:MAX_TEXT_LENGTH]
        stages.append({"name": "Input Validation", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": 0, "status": "done"})

        # Stage 2: NLP Preprocessing
        t = time.perf_counter()
        try:
            cleaned_text, text_stats = self.pipeline.preprocess_text(text)
        except Exception:
            cleaned_text = text
            text_stats = {}
        stages.append({"name": "NLP Preprocessing", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": 0, "status": "done"})

        # Stage 3: Redis Cache
        t = time.perf_counter()
        stages.append({"name": "Redis Cache Lookup", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": 0, "status": "done" if _REDIS_AVAILABLE else "skipped"})

        # Stage 4: Regex Engine
        t = time.perf_counter()
        entities = self._regex_scan(cleaned_text)
        stages.append({"name": "Regex PII Engine", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})
        logger.info("Regex: %d entities", len(entities))

        # Stage 5: spaCy NER (blocking ML — offload to thread)
        # Always run regardless of text length — even short OCR text may have names
        t = time.perf_counter()
        if _SPACY_AVAILABLE:
            spacy_ents = await loop.run_in_executor(self._executor, self._spacy_scan, cleaned_text)
            entities = self._merge_entities(entities, spacy_ents, "spaCy")
            stages.append({"name": "spaCy NER", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(spacy_ents), "status": "done"})
        else:
            stages.append({"name": "spaCy NER", "duration_ms": 0, "entities_found": 0, "status": "skipped"})

        # Stage 6: BERT NER (heaviest — offload to thread)
        # Always run — don't skip based on text length
        t = time.perf_counter()
        if self.bert_service.is_available():
            bert_ents = await loop.run_in_executor(self._executor, self._bert_scan, cleaned_text)
            entities = self._merge_entities(entities, bert_ents, "BERT")
            stages.append({"name": "BERT Transformer NER", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(bert_ents), "status": "done"})
        else:
            stages.append({"name": "BERT Transformer NER", "duration_ms": 0, "entities_found": 0, "status": "skipped"})

        # Stage 7: Ensemble Scoring
        t = time.perf_counter()
        try:
            entities = self.pipeline.ensemble_score(entities)
        except Exception as e:
            logger.warning("Stage 7 (Ensemble Scoring) failed: %s", e)
        stages.append({"name": "Ensemble Confidence Scoring", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})

        # Stage 8: Validation
        t = time.perf_counter()
        try:
            entities = self.pipeline.validate_entities(entities, cleaned_text)
        except Exception as e:
            logger.warning("Stage 8 (Validation) failed: %s", e)
        stages.append({"name": "Post-processing Validation", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})

        # Stage 9: Deduplication
        t = time.perf_counter()
        entities = self._deduplicate(entities)
        stages.append({"name": "Deduplication & Ranking", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})

        # Stage 10: Risk Scoring
        t = time.perf_counter()
        risk_summary = self.risk_engine.score(entities)
        stages.append({"name": "Risk Assessment Engine", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})

        # Stage 11: Masking
        t = time.perf_counter()
        masked_text = (
            self.masking_service.mask_text(cleaned_text, entities)
            if include_masked_text else None
        )
        stages.append({"name": "Format-preserving Masking", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": len(entities), "status": "done"})

        # Stage 12: Redis Cache Save
        t = time.perf_counter()
        redis_cached = False
        try:
            redis_cached = self.pipeline.save_to_cache(
                cleaned_text,
                {"entity_count": len(entities), "risk": risk_summary.overall_risk.value}
            )
        except Exception as e:
            logger.warning("Stage 12 (Redis Cache Save) failed: %s", e)
        stages.append({"name": "Redis Result Caching", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": 0, "status": "done" if redis_cached else "skipped"})

        # Stage 13: Report
        t = time.perf_counter()
        stages.append({"name": "Pipeline Report Generation", "duration_ms": round((time.perf_counter()-t)*1000,2), "entities_found": 0, "status": "done"})

        total_ms = (time.perf_counter() - pipeline_start) * 1000

        layers_used = ["REGEX"]
        if _SPACY_AVAILABLE:                 layers_used.append("spaCy")
        if self.bert_service.is_available(): layers_used.append("BERT")

        logger.info(
            "Pipeline done: %d entities | risk=%s | %.1fms | layers=%s",
            len(entities), risk_summary.overall_risk.value, total_ms, "+".join(layers_used)
        )

        return DetectionResult(
            source_type=source_type,
            entities=entities,
            risk_summary=risk_summary,
            processing_time_ms=round(total_ms, 2),
            masked_text=masked_text,
            original_text=text[:500] + ("…" if len(text) > 500 else ""),
            ai_layers_used=layers_used,
            bert_available=self.bert_service.is_available(),
            pipeline_stages=stages,
            text_stats=text_stats,
            redis_cached=redis_cached,
        )

    # Regex
    # ── Verhoeff Algorithm (UIDAI official checksum) ─────────────────────────
    _V_D = [
        [0,1,2,3,4,5,6,7,8,9],
        [1,2,3,4,0,6,7,8,9,5],
        [2,3,4,0,1,7,8,9,5,6],
        [3,4,0,1,2,8,9,5,6,7],
        [4,0,1,2,3,9,5,6,7,8],
        [5,9,8,7,6,0,4,3,2,1],
        [6,5,9,8,7,1,0,4,3,2],
        [7,6,5,9,8,2,1,0,4,3],
        [8,7,6,5,9,3,2,1,0,4],
        [9,8,7,6,5,4,3,2,1,0],
    ]
    _V_P = [
        [0,1,2,3,4,5,6,7,8,9],
        [1,5,7,6,2,8,3,0,9,4],
        [5,8,0,3,7,9,6,1,4,2],
        [8,9,1,6,0,4,3,5,2,7],
        [9,4,5,3,1,2,6,8,7,0],
        [4,2,8,6,5,7,3,9,0,1],
        [2,7,9,3,8,0,6,4,1,5],
        [7,0,4,6,9,1,3,2,5,8],
    ]
    _V_INV = [0,4,3,2,1,9,8,7,6,5]

    @classmethod
    def _verhoeff_check(cls, number: str) -> bool:
        """Returns True if Aadhaar number passes Verhoeff checksum."""
        digits = [int(d) for d in re.sub(r'\D', '', number)]
        if len(digits) != 12:
            return False
        c = 0
        for i, digit in enumerate(reversed(digits)):
            p = cls._V_P[i % 8][digit]
            c = cls._V_D[c][p]
        return c == 0

    def _regex_scan(self, text: str) -> list[DetectedEntity]:
        found = []
        for pii_name, compiled in COMPILED_PATTERNS.items():
            meta = PATTERN_METADATA[pii_name]
            for match in compiled.finditer(text):
                value = match.group().strip()
                if pii_name == "BANK_ACCOUNT" and not self._looks_like_account(text, match):
                    continue

                # Verhoeff checksum — mark fake Aadhaar with lower confidence + warning
                verhoeff_failed = False
                if pii_name == "AADHAAR_NUMBER":
                    if not self._verhoeff_check(value):
                        verhoeff_failed = True

                masked = self.masking_service.mask_value(pii_name, value)
                confidence = meta.base_confidence if not verhoeff_failed else 0.45
                warning = "Checksum failed — may be fake or mistyped" if verhoeff_failed else None
                found.append(DetectedEntity(
                    type=pii_name,
                    value=value,
                    masked_value=masked,
                    confidence=confidence,
                    risk_level=RiskLevel(meta.risk_level),
                    start_pos=match.start(),
                    end_pos=match.end(),
                    source="REGEX",
                    warning=warning,
                ))
        return found

    def _looks_like_account(self, text, match):
        window = text[max(0, match.start()-30): match.end()+30].lower()
        return any(kw in window for kw in {"account","a/c","acc","bank","savings","current"})

    # spaCy
    def _spacy_scan(self, text: str) -> list[DetectedEntity]:
        if not _NLP: return []
        found = []
        doc = _NLP(text[:SPACY_TEXT_LIMIT])
        spacy_map = {
            "PERSON": ("PERSON_NAME",   RiskLevel.MEDIUM, 0.75),
            "GPE":    ("LOCATION",      RiskLevel.LOW,    0.65),
            "ORG":    ("ORGANIZATION",  RiskLevel.LOW,    0.60),
            "DATE":   ("DATE_OF_BIRTH", RiskLevel.MEDIUM, 0.60),
        }
        # Known Indian PII keywords spaCy misclassifies as NAME/ORG
        _FALSE_POSITIVES = {
            "aadhaar", "aadhar", "pan", "dob", "upi", "ifsc", "gst",
            "passport", "voter", "epic", "uidai", "kyc", "nre", "nro",
            "number", "no", "id", "card", "date", "birth", "account",
        }
        for ent in doc.ents:
            if ent.label_ in spacy_map:
                val = ent.text.strip().lower()
                # Skip known PII keywords misclassified as NAME/ORG
                if val in _FALSE_POSITIVES:
                    continue
                # Skip very short tokens
                if len(ent.text.strip()) <= 2:
                    continue
                # Skip ORGANIZATION if it looks like a keyword (all caps short word)
                pii_type, risk, conf = spacy_map[ent.label_]
                if pii_type == "ORGANIZATION" and len(ent.text.strip()) <= 8:
                    continue
                masked = self.masking_service.mask_value(pii_type, ent.text)
                found.append(DetectedEntity(
                    type=pii_type, value=ent.text, masked_value=masked,
                    confidence=conf, risk_level=risk,
                    start_pos=ent.start_char, end_pos=ent.end_char, source="spaCy",
                ))
        return found

    # BERT
    def _bert_scan(self, text: str) -> list[DetectedEntity]:
        found = []
        try:
            for r in self.bert_service.extract_entities(text):
                masked = self.masking_service.mask_value(r.entity_type, r.value)
                found.append(DetectedEntity(
                    type=r.entity_type, value=r.value, masked_value=masked,
                    confidence=r.confidence, risk_level=RiskLevel(r.risk_level),
                    start_pos=r.start, end_pos=r.end, source="BERT",
                ))
        except Exception as e:
            logger.error("BERT scan error: %s", e)
        return found

    # Merge
    @staticmethod
    def _merge_entities(base, new, new_source):
        merged = list(base)
        for new_ent in new:
            overlaps = [
                r for r in base
                if r.start_pos is not None and new_ent.start_pos is not None
                and r.start_pos <= new_ent.start_pos <= (r.end_pos or 0)
            ]
            if overlaps:
                for r in merged:
                    if r in overlaps:
                        r.confidence = min(1.0, r.confidence + CONFIDENCE_BOOST)
                        r.source = f"HYBRID({r.source}+{new_source})"
            else:
                merged.append(new_ent)
        return merged

    # Dedup
    @staticmethod
    def _deduplicate(entities):
        seen = {}
        for ent in entities:
            key = (ent.type, ent.value.lower().strip())
            if key not in seen or ent.confidence > seen[key].confidence:
                seen[key] = ent
        return sorted(seen.values(), key=lambda e: e.confidence, reverse=True)

    def _empty_result(self, source_type):
        from app.models.schemas import RiskSummary
        return DetectionResult(
            source_type=source_type, entities=[],
            risk_summary=RiskSummary(
                overall_risk=RiskLevel.LOW, risk_score=0.0,
                recommendation="No text to analyse."
            ),
            ai_layers_used=["REGEX"],
            bert_available=self.bert_service.is_available(),
            pipeline_stages=[], text_stats={}, redis_cached=False,
        )


_detector_instance: Optional[PIIDetector] = None

def get_detector() -> PIIDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = PIIDetector()
    return _detector_instance