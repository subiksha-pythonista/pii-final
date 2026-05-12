"""
Structured JSON logger for the PII Detection System.
Masks PII values in log output to avoid log-leakage.
"""

import logging
import json
import re
import sys
from datetime import datetime, timezone


class PIISafeFormatter(logging.Formatter):
    """
    Custom formatter that:
    1. Outputs JSON-structured log lines
    2. Masks obvious PII patterns before writing to output
    """

    # Rough patterns used only for log sanitisation (not for detection)
    _SANITISE_PATTERNS = [
        re.compile(r"\b[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}\b"),      # Aadhaar
        re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),                        # PAN
        re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b"),  # email
    ]

    def _mask(self, text: str) -> str:
        for pattern in self._SANITISE_PATTERNS:
            text = pattern.sub("[REDACTED]", text)
        return text

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": self._mask(record.getMessage()),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(PIISafeFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
    return logger
