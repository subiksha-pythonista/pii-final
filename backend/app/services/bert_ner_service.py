"""
BERT NER Service
Uses HuggingFace Transformers with a pre-trained BERT model for
Named Entity Recognition. Runs 100% locally, completely free.

Model: dslim/bert-base-NER (fine-tuned BERT for NER)
- Detects: PER (Person), ORG (Organisation), LOC (Location), MISC
- Downloads once (~400MB) on first run, cached locally forever
- No API key, no internet after first download
"""

from __future__ import annotations
import time
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Load BERT NER pipeline ────────────────────────────────────────────────────
# Gracefully degrades if transformers not installed
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
    import torch

    logger.info("Loading BERT NER model (dslim/bert-base-NER)...")
    logger.info("First run will download ~400MB — subsequent runs use cache.")

    # Use CPU (works on all machines, no GPU needed)
    _device = 0 if torch.cuda.is_available() else -1
    _device_name = "GPU" if torch.cuda.is_available() else "CPU"

    # Load the BERT NER pipeline
    # dslim/bert-base-NER is fine-tuned on CoNLL-2003 NER dataset
    _BERT_NER = pipeline(
        "ner",
        model="dslim/bert-base-NER",
        tokenizer="dslim/bert-base-NER",
        aggregation_strategy="simple",  # merges sub-word tokens
        device=_device,
    )
    _BERT_AVAILABLE = True
    logger.info(f"BERT NER model loaded successfully on {_device_name}.")

except Exception as exc:
    _BERT_NER = None
    _BERT_AVAILABLE = False
    logger.warning(f"BERT NER not available: {exc}")


# ── BERT label → PII type mapping ────────────────────────────────────────────
_BERT_FALSE_POSITIVES = {
    "aadhaar", "aadhar", "pan", "dob", "upi", "ifsc", "gst",
    "passport", "voter", "kyc", "uidai", "number", "card", "id",
    "india", "indian", "government", "ministry", "department",
}

_BERT_TO_PII = {
    "PER":  ("PERSON_NAME",   "MEDIUM", 0.82),
    "ORG":  ("ORGANIZATION",  "LOW",    0.75),
    "LOC":  ("LOCATION",      "LOW",    0.70),
    "MISC": ("MISC_ENTITY",   "LOW",    0.60),
}


class BERTNERResult:
    def __init__(self, entity_type: str, value: str, confidence: float,
                 risk_level: str, start: int, end: int):
        self.entity_type = entity_type
        self.value       = value
        self.confidence  = confidence
        self.risk_level  = risk_level
        self.start       = start
        self.end         = end
        self.source      = "BERT"


class BERTNERService:
    """
    Real BERT-based Named Entity Recognition.
    Extracts person names, organisations, locations from text
    using a fine-tuned BERT transformer model.
    """

    def is_available(self) -> bool:
        return _BERT_AVAILABLE

    def extract_entities(self, text: str) -> list[BERTNERResult]:
        """
        Run BERT NER on input text.
        Returns list of detected named entities with confidence scores.
        """
        if not _BERT_AVAILABLE or _BERT_NER is None:
            logger.warning("BERT NER not available — skipping.")
            return []

        if not text or not text.strip():
            return []

        try:
            start = time.perf_counter()

            # BERT has 512 token limit — process in chunks if needed
            results = []
            chunk_size = 400  # safe chunk size in characters
            offset = 0

            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                chunk_results = _BERT_NER(chunk)

                for ent in chunk_results:
                    label = ent.get("entity_group", "")
                    score = float(ent.get("score", 0.0))
                    word  = ent.get("word", "").strip()
                    start_pos = ent.get("start", 0) + i
                    end_pos   = ent.get("end", 0) + i

                    # Filter low confidence — lowered to 0.40 to catch OCR-garbled text
                    if score < 0.40:
                        continue

                    # Filter very short entities (likely noise)
                    if len(word) < 2:
                        continue

                    if label in _BERT_TO_PII:
                        # Skip known false positives
                        if word.lower() in _BERT_FALSE_POSITIVES:
                            continue
                        # Skip very short ORG/MISC entities — usually noise
                        pii_type, risk_level, base_conf = _BERT_TO_PII[label]
                        if pii_type in ("ORGANIZATION", "MISC_ENTITY") and len(word) <= 8:
                            continue
                        # Combine BERT confidence with base confidence
                        final_conf = round((score + base_conf) / 2, 3)

                        results.append(BERTNERResult(
                            entity_type=pii_type,
                            value=word,
                            confidence=final_conf,
                            risk_level=risk_level,
                            start=start_pos,
                            end=end_pos,
                        ))

            elapsed = (time.perf_counter() - start) * 1000
            logger.info(
                "BERT NER: %d entities in %.1fms",
                len(results), elapsed
            )
            return results

        except Exception as exc:
            logger.error("BERT NER extraction failed: %s", exc)
            return []

    def get_model_info(self) -> dict:
        """Returns info about the loaded BERT model."""
        if not _BERT_AVAILABLE:
            return {"available": False, "model": None}
        return {
            "available":  True,
            "model":      "dslim/bert-base-NER",
            "device":     "GPU" if (_BERT_NER and _BERT_NER.device.type == "cuda") else "CPU",
            "framework":  "HuggingFace Transformers",
            "task":       "token-classification",
            "labels":     ["PER", "ORG", "LOC", "MISC"],
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
_bert_instance: Optional[BERTNERService] = None


def get_bert_service() -> BERTNERService:
    global _bert_instance
    if _bert_instance is None:
        _bert_instance = BERTNERService()
    return _bert_instance