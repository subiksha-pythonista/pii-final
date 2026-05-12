"""
Health route — returns status of all AI components
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check():
    from app.services.pii_detector import get_detector
    from app.services.ocr_service import get_ocr_service
    from app.services.speech_service import get_speech_service

    detector = get_detector()
    bert_info = detector.bert_service.get_model_info()

    return {
        "status":  "ok",
        "version": "1.0.0",
        "service": "PII Detection System",
        "ai_components": {
            "bert_ner": {
                "available": bert_info["available"],
                "model":     bert_info.get("model"),
                "device":    bert_info.get("device"),
            },
            "spacy_ner": {
                "available": True,
                "model":     "en_core_web_sm",
            },
            "regex_engine": {
                "available": True,
                "patterns":  13,
            },
            "tesseract_ocr": {
                "available": get_ocr_service()._TESSERACT_AVAILABLE
                             if hasattr(get_ocr_service(), '_TESSERACT_AVAILABLE') else True,
            },
            "whisper_stt": {
                "available": get_speech_service()._WHISPER_AVAILABLE
                             if hasattr(get_speech_service(), '_WHISPER_AVAILABLE') else True,
            },
        },
    }
