"""
Document Detection Routes — POST /detect/document
"""
import traceback
import asyncio
import inspect
from fastapi import APIRouter, UploadFile, File, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import DetectionResult, SourceType
from app.services.pii_detector import get_detector
from app.services.ocr_service import get_ocr_service
from app.db.database import get_db
from app.db.models import AuditLog, ScanResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

_ALLOWED_MIME = {
    "image/jpeg", "image/jpg", "image/png", "image/tiff",
    "image/bmp", "image/webp", "application/pdf",
    "image/x-png",
}

@router.post("/document", response_model=DetectionResult)
async def detect_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        mime = (file.content_type or "").lower()
        if mime and mime not in _ALLOWED_MIME and not mime.startswith("image/"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {mime}. Use PNG, JPG, PDF."
            )

        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=422, detail="File is empty.")

        if len(raw) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

        # OCR
        ocr = get_ocr_service()
        if "pdf" in mime:
            ocr_result = ocr.extract_from_pdf_bytes(raw)
        else:
            ocr_result = ocr.extract_from_image_bytes(raw)

        extracted_text = ocr_result.text.strip() if ocr_result.text else ""
        if not extracted_text or extracted_text.startswith("[OCR not"):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not extract text from this image. "
                    "Make sure Tesseract is installed and the image contains readable text. "
                    "Try a clearer photo of an Aadhaar card, PAN card, or any document."
                )
            )

        # PII Detection — sync or async detect() handle pannurom
        detector = get_detector()
        if inspect.iscoroutinefunction(detector.detect):
            # async function — await panna
            result = await detector.detect(
                text=extracted_text,
                source_type=SourceType.DOCUMENT,
                include_masked_text=True,
            )
        else:
            # sync function — thread executor la run panna (block aagaadha)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: detector.detect(
                    text=extracted_text,
                    source_type=SourceType.DOCUMENT,
                    include_masked_text=True,
                )
            )

        # ocr_confidence set panna
        result.ocr_confidence = ocr_result.confidence

        # DB write — background la pannidu
        ip = request.client.host if request.client else "unknown"

        async def _save_to_db():
            try:
                db.add(AuditLog(
                    request_id=result.request_id,
                    action="DETECT_DOCUMENT",
                    source_type="DOCUMENT",
                    entity_count=result.risk_summary.total_entities,
                    risk_level=result.risk_summary.overall_risk.value,
                    risk_score=result.risk_summary.risk_score,
                    processing_time_ms=result.processing_time_ms,
                    ip_address=ip,
                ))
                db.add(ScanResult(
                    request_id=result.request_id,
                    source_type="DOCUMENT",
                    entity_count=result.risk_summary.total_entities,
                    overall_risk=result.risk_summary.overall_risk.value,
                    risk_score=result.risk_summary.risk_score,
                    entity_types=[e.type for e in result.entities],
                    processing_time_ms=result.processing_time_ms,
                ))
                await db.commit()
            except Exception as e:
                logger.warning("Background DB save failed: %s", e)

        background_tasks.add_task(_save_to_db)

        return result

    except HTTPException:
        raise
    except Exception as e:
        error_detail = str(e)
        logger.error("Document detection failed: %s\n%s", error_detail, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during document scan: {error_detail}"
        )