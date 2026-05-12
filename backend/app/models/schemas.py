"""
Pydantic Schemas — all request/response models
Updated with full pipeline stage metadata + safety fields
"""
from __future__ import annotations
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class RiskLevel(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


class SourceType(str, Enum):
    TEXT     = "TEXT"
    DOCUMENT = "DOCUMENT"
    AUDIO    = "AUDIO"
    STREAM   = "STREAM"


class DetectedEntity(BaseModel):
    id:           str   = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type:         str
    value:        str
    masked_value: str
    confidence:   float
    risk_level:   RiskLevel
    start_pos:    Optional[int] = None
    end_pos:      Optional[int] = None
    source:       str = "REGEX"


class RiskSummary(BaseModel):
    overall_risk:        RiskLevel
    risk_score:          float
    critical_count:      int = 0
    high_count:          int = 0
    medium_count:        int = 0
    low_count:           int = 0
    total_entities:      int = 0
    recommendation:      str = ""
    safety_score:        float = 100.0
    safety_label:        str = "Safe"
    why_unsafe:          str = ""
    risk_reasons:        list[str] = []
    recommended_actions: list[str] = []


class DetectionResult(BaseModel):
    request_id:         str      = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp:          datetime = Field(default_factory=datetime.utcnow)
    source_type:        SourceType
    entities:           list[DetectedEntity] = []
    risk_summary:       RiskSummary
    processing_time_ms: float = 0.0
    masked_text:        Optional[str] = None
    original_text:      Optional[str] = None
    ocr_confidence:     Optional[float] = None
    transcript:         Optional[str] = None
    ai_layers_used:     list[str] = []
    bert_available:     bool = False
    pipeline_stages:    list[dict] = []
    text_stats:         dict = {}
    redis_cached:       bool = False


class TextDetectRequest(BaseModel):
    text:                str  = Field(..., min_length=1, max_length=50_000)
    include_masked_text: bool = True


class StreamMessage(BaseModel):
    message_id: str      = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender:     str
    content:    str
    timestamp:  datetime = Field(default_factory=datetime.utcnow)
    detection_result: Optional[DetectionResult] = None


class DailyStats(BaseModel):
    date:            str
    total_scans:     int
    total_entities:  int
    high_risk_count: int


class AnalyticsResponse(BaseModel):
    total_scans:             int
    total_entities_detected: int
    entity_type_breakdown:   dict[str, int]
    risk_level_breakdown:    dict[str, int]
    source_type_breakdown:   dict[str, int]
    avg_processing_time_ms:  float
    daily_stats:             list[DailyStats]
    precision_estimate:      float
    recall_estimate:         float
    avg_risk_score:          float = 0.0
    max_risk_score:          float = 0.0


class AuditLogEntry(BaseModel):
    id:                 int
    request_id:         str
    action:             str
    source_type:        str
    entity_count:       int
    risk_level:         str
    processing_time_ms: float
    timestamp:          datetime
    ip_address:         Optional[str] = None


class AuditLogResponse(BaseModel):
    logs:      list[AuditLogEntry]
    total:     int
    page:      int
    page_size: int