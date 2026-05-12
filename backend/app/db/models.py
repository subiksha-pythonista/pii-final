"""
SQLAlchemy ORM Models
"""
from __future__ import annotations
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    JSON, Boolean, Text
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    request_id         = Column(String(64),  nullable=True, index=True)
    action             = Column(String(50),  nullable=True, index=True)
    source_type        = Column(String(20),  nullable=True)
    entity_count       = Column(Integer,     default=0)
    risk_level         = Column(String(20),  nullable=True, index=True)
    risk_score         = Column(Float,       default=0.0)
    processing_time_ms = Column(Float,       default=0.0)
    ip_address         = Column(String(45),  nullable=True)
    timestamp          = Column(DateTime,    default=datetime.utcnow, index=True)


class ScanResult(Base):
    __tablename__ = "scan_results"

    id                 = Column(Integer,     primary_key=True, autoincrement=True)
    request_id         = Column(String(64),  nullable=True, index=True)
    source_type        = Column(String(20),  nullable=True, index=True)
    entity_count       = Column(Integer,     default=0)
    overall_risk       = Column(String(20),  nullable=True, index=True)
    risk_score         = Column(Float,       default=0.0)
    entity_types       = Column(JSON,        nullable=True)
    processing_time_ms = Column(Float,       default=0.0)
    created_at         = Column(DateTime,    default=datetime.utcnow, index=True)