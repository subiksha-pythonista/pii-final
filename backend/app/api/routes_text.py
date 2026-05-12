"""
Text Detection Routes — POST /detect/text
"""
import traceback
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import TextDetectRequest, DetectionResult, SourceType
from app.services.pii_detector import get_detector
from app.db.database import get_db
from app.db.models import AuditLog, ScanResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/text", response_model=DetectionResult)
async def detect_text(
    body: TextDetectRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        detector = get_detector()
        result = await detector.detect(
            text=body.text,
            source_type=SourceType.TEXT,
            include_masked_text=body.include_masked_text,
        )
        ip = request.client.host if request.client else "unknown"
        db.add(AuditLog(
            request_id=result.request_id, action="DETECT_TEXT",
            source_type="TEXT",
            entity_count=result.risk_summary.total_entities,
            risk_level=result.risk_summary.overall_risk.value,
            risk_score=result.risk_summary.risk_score,
            processing_time_ms=result.processing_time_ms,
            ip_address=ip,
        ))
        db.add(ScanResult(
            request_id=result.request_id, source_type="TEXT",
            entity_count=result.risk_summary.total_entities,
            overall_risk=result.risk_summary.overall_risk.value,
            risk_score=result.risk_summary.risk_score,
            entity_types=[e.type for e in result.entities],
            processing_time_ms=result.processing_time_ms,
        ))
        await db.commit()
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Text detection failed: %s\n%s", str(e), traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")