"""
Heavy Processing Pipeline Engine
Redis caching, NLP preprocessing, ensemble scoring, validation
"""
from __future__ import annotations
import time
import hashlib
import json
import re
from typing import Optional
from dataclasses import dataclass, field
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Redis — module level variable (exported for use in pii_detector)
try:
    import redis as redis_lib
    _redis = redis_lib.Redis(host='localhost', port=6379, db=0,
                             decode_responses=True, socket_connect_timeout=2)
    _redis.ping()
    _REDIS_AVAILABLE = True
    logger.info("Redis cache connected.")
except Exception:
    _redis = None
    _REDIS_AVAILABLE = False
    logger.warning("Redis not available — running without cache.")


@dataclass
class PipelineStage:
    name: str
    duration_ms: float = 0.0
    entities_found: int = 0
    status: str = "pending"


class PipelineEngine:
    CACHE_TTL = 3600

    def get_cache_key(self, text: str) -> str:
        return f"pii:result:{hashlib.sha256(text.encode()).hexdigest()[:16]}"

    def check_cache(self, text: str) -> Optional[dict]:
        if not _REDIS_AVAILABLE or not _redis:
            return None
        try:
            cached = _redis.get(self.get_cache_key(text))
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    def save_to_cache(self, text: str, result: dict) -> bool:
        if not _REDIS_AVAILABLE or not _redis:
            return False
        try:
            _redis.setex(self.get_cache_key(text), self.CACHE_TTL,
                         json.dumps(result, default=str))
            return True
        except Exception:
            return False

    def preprocess_text(self, text: str) -> tuple[str, dict]:
        start = time.perf_counter()
        # Normalise
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        cleaned = re.sub(r'\r\n|\r', '\n', cleaned)
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        # Text stats
        words     = cleaned.split()
        sentences = re.split(r'[.!?]+', cleaned)
        stats = {
            "char_count":       len(text),
            "word_count":       len(words),
            "sentence_count":   len([s for s in sentences if s.strip()]),
            "avg_word_length":  round(sum(len(w) for w in words) / max(len(words), 1), 2),
            "digit_density":    round(sum(c.isdigit() for c in text) / max(len(text), 1), 3),
            "uppercase_ratio":  round(sum(c.isupper() for c in text) / max(len(text), 1), 3),
            "preprocessing_ms": round((time.perf_counter() - start) * 1000, 2),
        }
        return cleaned, stats

    def ensemble_score(self, entities: list) -> list:
        source_weights = {
            'REGEX': 0.85, 'spaCy': 0.80, 'BERT': 0.95, 'HYBRID': 1.00
        }
        for ent in entities:
            source = getattr(ent, 'source', 'REGEX')
            weight = source_weights.get(
                'HYBRID' if source.startswith('HYBRID') else source, 0.80
            )
            base = getattr(ent, 'confidence', 0.80)
            ent.confidence = round(min(1.0, base * weight + (1 - weight) * base), 3)
        return sorted(entities, key=lambda e: e.confidence, reverse=True)

    def validate_entities(self, entities: list, text: str) -> list:
        validated = []
        for ent in entities:
            value = getattr(ent, 'value', '')
            conf  = getattr(ent, 'confidence', 0.0)
            if value and value not in text:
                continue
            if conf < 0.40:
                continue
            validated.append(ent)
        return validated

    def compute_pipeline_report(self, stages, text_stats, cache_hit, redis_cached):
        total_ms = sum(s.duration_ms for s in stages)
        return {
            "total_duration_ms": round(total_ms, 2),
            "cache_hit": cache_hit,
            "redis_cached": redis_cached,
            "stage_count": len(stages),
        }


_pipeline_instance: Optional[PipelineEngine] = None

def get_pipeline() -> PipelineEngine:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = PipelineEngine()
    return _pipeline_instance
