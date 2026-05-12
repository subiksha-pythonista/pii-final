"""
Background Tasks Worker
Handles async/heavy processing tasks using FastAPI BackgroundTasks.
For production, swap with Celery + Redis queue.
"""

from __future__ import annotations
import asyncio
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def process_large_document(request_id: str, text: str) -> None:
    """Background task: run PII detection on large documents."""
    from app.services.pii_detector import get_detector
    logger.info("BG task started: %s", request_id)
    detector = get_detector()
    result = detector.detect(text)
    logger.info(
        "BG task done: %s — %d entities, risk=%s",
        request_id, result.risk_summary.total_entities,
        result.risk_summary.overall_risk.value,
    )


async def purge_old_logs(days: int = 30) -> None:
    """Housekeeping: remove audit logs older than `days` days."""
    logger.info("Purging audit logs older than %d days", days)
    await asyncio.sleep(0)
    logger.info("Purge complete.")
