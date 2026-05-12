"""
Audio Detection Routes — POST /detect/audio
Whisper STT → PII detection → save to DB with explicit commit
"""
from fastapi import APIRouter, UploadFile, File, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import DetectionResult, SourceType
from app.services.pii_detector import get_detector
from app.services.speech_service import get_speech_service
from app.db.database import get_db
from app.db.models import AuditLog, ScanResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

_ALLOWED_AUDIO = {
    "audio/wav","audio/wave","audio/x-wav","audio/mpeg","audio/mp3",
    "audio/mp4","audio/ogg","audio/flac","audio/webm","video/webm",
}
_EXTENSION_MAP = {
    "audio/wav":"wav","audio/wave":"wav","audio/x-wav":"wav",
    "audio/mpeg":"mp3","audio/mp3":"mp3","audio/mp4":"mp4",
    "audio/ogg":"ogg","audio/flac":"flac","audio/webm":"webm","video/webm":"webm",
}

@router.post("/audio", response_model=DetectionResult)
async def detect_audio(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    mime = file.content_type or "audio/wav"
    if mime not in _ALLOWED_AUDIO:
        raise HTTPException(status_code=415, detail=f"Unsupported audio type: {mime}")

    raw = await file.read()
    if len(raw) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio too large (max 50 MB)")

    speech = get_speech_service()
    transcript = speech.transcribe_bytes(raw, file_extension=_EXTENSION_MAP.get(mime, "wav"))

    if not transcript.text or transcript.text.startswith("[Whisper"):
        raise HTTPException(status_code=422, detail="Transcription failed. Install openai-whisper.")

    detector = get_detector()
    result = await detector.detect(text=transcript.text, source_type=SourceType.AUDIO, include_masked_text=True)
    result.transcript = transcript.text

    ip = request.client.host if request.client else "unknown"
    db.add(AuditLog(
        request_id=result.request_id, action="DETECT_AUDIO", source_type="AUDIO",
        entity_count=result.risk_summary.total_entities,
        risk_level=result.risk_summary.overall_risk.value,
        risk_score=result.risk_summary.risk_score,
        processing_time_ms=result.processing_time_ms, ip_address=ip,
    ))
    db.add(ScanResult(
        request_id=result.request_id, source_type="AUDIO",
        entity_count=result.risk_summary.total_entities,
        overall_risk=result.risk_summary.overall_risk.value,
        risk_score=result.risk_summary.risk_score,
        entity_types=[e.type for e in result.entities],
        processing_time_ms=result.processing_time_ms,
    ))
    await db.commit()
    return result