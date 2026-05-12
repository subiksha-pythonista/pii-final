# app/services/audit_writer.py
# Scan result-a DB-la save panra service

from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import uuid
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def write_audit_log(
    db: Session,
    result,              # DetectionResult object
    source_type: str = "TEXT",
    user_id: str = None,
):
    """
    Every scan complete aana appuram itha call pannu.
    Itha call pannatha audit_logs table empty-aa irukum!
    """
    try:
        request_id = str(uuid.uuid4())

        # Overall scan record
        db.execute(text("""
            INSERT INTO audit_logs (
                request_id,
                action,
                source_type,
                entity_count,
                risk_level,
                risk_score,
                processing_time_ms,
                ai_layers_used,
                user_id,
                created_at
            ) VALUES (
                :request_id,
                'scan_complete',
                :source_type,
                :entity_count,
                :risk_level,
                :risk_score,
                :processing_time_ms,
                :ai_layers,
                :user_id,
                :created_at
            )
        """), {
            "request_id":        request_id,
            "source_type":       source_type,
            "entity_count":      len(result.entities),
            "risk_level":        result.risk_summary.overall_risk.value.upper(),
            "risk_score":        float(result.risk_summary.risk_score or 0),
            "processing_time_ms":float(result.processing_time_ms or 0),
            "ai_layers":         ",".join(result.ai_layers_used or []),
            "user_id":           user_id,
            "created_at":        datetime.utcnow(),
        })

        # Each entity separately — for breakdown charts
        for entity in result.entities:
            db.execute(text("""
                INSERT INTO audit_logs (
                    request_id,
                    action,
                    source_type,
                    entity_type,
                    risk_level,
                    confidence,
                    source,
                    user_id,
                    created_at
                ) VALUES (
                    :request_id,
                    'entity_detected',
                    :source_type,
                    :entity_type,
                    :risk_level,
                    :confidence,
                    :source,
                    :user_id,
                    :created_at
                )
            """), {
                "request_id":  request_id,
                "source_type": source_type,
                "entity_type": entity.type,
                "risk_level":  entity.risk_level.value.upper()
                               if hasattr(entity.risk_level, 'value')
                               else str(entity.risk_level).upper(),
                "confidence":  float(entity.confidence or 0),
                "source":      entity.source or "REGEX",
                "user_id":     user_id,
                "created_at":  datetime.utcnow(),
            })

        db.commit()
        logger.info(
            "Audit log written: %s | %d entities | risk=%s",
            request_id, len(result.entities),
            result.risk_summary.overall_risk.value
        )
        return request_id

    except Exception as e:
        logger.error("Audit log write failed: %s", e)
        db.rollback()
        return None