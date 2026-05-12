"""
Speech-to-Text Service
Uses OpenAI Whisper (open-source, runs locally) for audio transcription.
Gracefully degrades if Whisper is not installed.
"""

from __future__ import annotations
import io
import tempfile
import os
from dataclasses import dataclass
from typing import Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Optional Whisper import
try:
    import whisper
    _WHISPER_MODEL = whisper.load_model("base")   # use "small" for better accuracy
    _WHISPER_AVAILABLE = True
    logger.info("Whisper model loaded: base")
except Exception as exc:
    _WHISPER_MODEL = None
    _WHISPER_AVAILABLE = False
    logger.warning("Whisper not available: %s", exc)


@dataclass
class TranscriptResult:
    text: str
    language: str
    confidence: float        # 0.0 – 1.0  (avg log-prob from segments)
    duration_seconds: float
    segments: list[dict]     # [{start, end, text}]


class SpeechService:

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        file_extension: str = "wav",
    ) -> TranscriptResult:
        """
        Transcribe raw audio bytes.
        Whisper requires a file path so we write to a temp file.
        """
        if not _WHISPER_AVAILABLE or _WHISPER_MODEL is None:
            return TranscriptResult(
                text="[Whisper not available — install openai-whisper]",
                language="en",
                confidence=0.0,
                duration_seconds=0.0,
                segments=[],
            )

        suffix = f".{file_extension.lstrip('.')}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = _WHISPER_MODEL.transcribe(
                tmp_path,
                fp16=False,       # safer on CPU
                language=None,    # auto-detect
            )
            confidence = self._avg_confidence(result.get("segments", []))
            duration = result.get("segments", [{}])[-1].get("end", 0.0) if result.get("segments") else 0.0

            return TranscriptResult(
                text=result.get("text", "").strip(),
                language=result.get("language", "en"),
                confidence=confidence,
                duration_seconds=duration,
                segments=[
                    {"start": s["start"], "end": s["end"], "text": s["text"]}
                    for s in result.get("segments", [])
                ],
            )
        except Exception as exc:
            logger.error("Whisper transcription failed: %s", exc)
            return TranscriptResult(
                text="", language="en", confidence=0.0,
                duration_seconds=0.0, segments=[],
            )
        finally:
            os.unlink(tmp_path)

    @staticmethod
    def _avg_confidence(segments: list[dict]) -> float:
        """
        Whisper provides avg_logprob per segment.
        Convert to a 0–1 confidence: e^avg_logprob (clamped).
        """
        if not segments:
            return 0.5
        import math
        log_probs = [s.get("avg_logprob", -1.0) for s in segments]
        avg = sum(log_probs) / len(log_probs)
        return round(min(1.0, math.exp(avg)), 3)


# Singleton
_speech_instance: Optional[SpeechService] = None


def get_speech_service() -> SpeechService:
    global _speech_instance
    if _speech_instance is None:
        _speech_instance = SpeechService()
    return _speech_instance
