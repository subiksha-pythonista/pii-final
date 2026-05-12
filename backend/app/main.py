"""
Indian Government PII Detection System — FastAPI Backend
Main application entry point with proper CORS config
"""
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio

from app.api.routes_text      import router as text_router
from app.api.routes_document  import router as document_router
from app.api.routes_audio     import router as audio_router
from app.api.routes_stream    import router as stream_router
from app.api.routes_analytics import router as analytics_router
from app.db.database import init_db
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PII Detection System with BERT AI...")
    await init_db()
    logger.info("Database initialized.")
    from app.services.pii_detector import get_detector
    detector = get_detector()
    logger.info("AI Pipeline ready — BERT:%s | spaCy:ON | Regex:13",
                "ON" if detector.bert_service.is_available() else "OFF")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Indian Government PII Detection System",
    description="Real-time detection with BERT AI + spaCy NER + Regex Engine",
    version="2.0.0",
    lifespan=lifespan,
)

# ── Request Timeout Middleware ────────────────────────────────────────────────
# ← FIXED: WebSocket requests skip pannurom — timeout apply aagaadha
REQUEST_TIMEOUT_SECONDS = 60

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    # WebSocket upgrade requests — skip timeout middleware
    if request.headers.get("upgrade", "").lower() == "websocket":
        return await call_next(request)
    try:
        return await asyncio.wait_for(call_next(request), timeout=REQUEST_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error("Request timed out: %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timed out. Try with shorter text or retry."},
        )

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(text_router,      prefix="/detect",    tags=["Detection"])
app.include_router(document_router,  prefix="/detect",    tags=["Detection"])
app.include_router(audio_router,     prefix="/detect",    tags=["Detection"])
app.include_router(stream_router,    prefix="/stream",    tags=["Streaming"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])


@app.get("/health", tags=["System"])
async def health_check():
    from app.services.pii_detector import get_detector
    detector  = get_detector()
    bert_info = detector.bert_service.get_model_info()
    return {
        "status":  "ok",
        "version": "2.0.0",
        "service": "PII Detection System",
        "ai_layers": {
            "bert":  {"available": bert_info["available"], "model": bert_info.get("model")},
            "spacy": {"available": True, "model": "en_core_web_sm"},
            "regex": {"available": True, "patterns": 13},
        },
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "PII Detection System is running",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)