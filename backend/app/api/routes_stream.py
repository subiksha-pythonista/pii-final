"""
Live Stream Detection Routes
GET  /stream/live       — WebSocket: sends simulated chat messages + PII detection
POST /stream/message    — REST: submit a single message for detection
GET  /stream/simulate   — SSE: server-sent events simulation
"""

from __future__ import annotations
import asyncio
import json
import random
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse

from app.services.pii_detector import get_detector
from app.models.schemas import SourceType, StreamMessage
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

_SAMPLE_MESSAGES = [
    ("Priya Sharma",    "Please find attached: Aadhaar 2345 6789 0123"),
    ("Rajesh Kumar",    "My PAN is ABCPF1234F for KYC"),
    ("Support Bot",     "Enter your phone number starting with +91 9876543210"),
    ("Anita Singh",     "DOB: 15/08/1995, Voter ID: ABC1234567"),
    ("Sanjay Mehta",    "Bank acc: 1234567890, IFSC: HDFC0001234"),
    ("Kavya Reddy",     "Passport J1234567 needs renewal"),
    ("Admin",           "Session started. All clear for now."),
    ("Deepak Verma",    "My email is deepak.verma@gmail.com and DL: MH2019001234567"),
    ("Riya Patel",      "UPI ID: riya.patel@okaxis for payment"),
    ("System",          "Ping — no PII in this message."),
    ("Amit Joshi",      "GST: 27AABCU9603R1ZX for invoice"),
    ("Neha Gupta",      "Address PIN: 400001, near Churchgate"),
]

_SENDERS = ["Priya", "Rajesh", "Anita", "Sanjay", "Kavya", "Deepak", "Riya", "Amit"]


class ConnectionManager:
    def __init__(self):
        self._active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.append(ws)
        logger.info("WS client connected. Total: %d", len(self._active))

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._active:
            self._active.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self._active))

    async def broadcast(self, data: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self._active:
                self._active.remove(ws)


manager = ConnectionManager()


@router.websocket("/live")
async def stream_live(websocket: WebSocket):
    await manager.connect(websocket)
    detector = get_detector()

    try:
        idx = 0
        while True:
            sender, content = _SAMPLE_MESSAGES[idx % len(_SAMPLE_MESSAGES)]
            idx += 1

            # ← FIXED: await pannurom — async detect()
            det = await detector.detect(
                text=content,
                source_type=SourceType.STREAM,
                include_masked_text=True,
            )

            payload = {
                "message_id":   det.request_id,
                "sender":       sender,
                "content":      content,
                "masked":       det.masked_text,
                "timestamp":    datetime.now(timezone.utc).isoformat(),
                "pii_found":    len(det.entities) > 0,
                "entity_count": det.risk_summary.total_entities,
                "risk_level":   det.risk_summary.overall_risk.value,
                "entities": [
                    {
                        "type":         e.type,
                        "value":        e.value,
                        "masked_value": e.masked_value,
                        "confidence":   e.confidence,
                        "risk_level":   e.risk_level.value,
                    }
                    for e in det.entities
                ],
                "processing_ms": det.processing_time_ms,
            }

            await websocket.send_json(payload)
            await asyncio.sleep(random.uniform(2, 4))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.error("WebSocket error: %s", exc)
        manager.disconnect(websocket)


@router.post("/message", summary="Detect PII in a single stream message")
async def detect_stream_message(body: StreamMessage):
    detector = get_detector()
    # ← FIXED: await pannurom
    result = await detector.detect(
        text=body.content,
        source_type=SourceType.STREAM,
        include_masked_text=True,
    )
    body.detection_result = result
    return body


async def _sse_generator():
    detector = get_detector()
    idx = 0
    while True:
        sender, content = _SAMPLE_MESSAGES[idx % len(_SAMPLE_MESSAGES)]
        idx += 1

        # ← FIXED: await pannurom
        det = await detector.detect(content, SourceType.STREAM)
        data = json.dumps({
            "sender":      sender,
            "content":     content,
            "risk_level":  det.risk_summary.overall_risk.value,
            "entities":    [{"type": e.type, "value": e.masked_value} for e in det.entities],
            "timestamp":   datetime.now(timezone.utc).isoformat(),
        })
        yield f"data: {data}\n\n"
        await asyncio.sleep(random.uniform(2, 4))


@router.get("/simulate", summary="SSE fallback for live stream simulation")
async def simulate_stream():
    return StreamingResponse(
        _sse_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )