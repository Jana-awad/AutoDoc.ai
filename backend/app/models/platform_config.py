"""Singleton platform-wide operator controls (kill switches, governance, incident notes)."""

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db.base import Base


class PlatformConfig(Base):
    __tablename__ = "platform_config"

    id = Column(Integer, primary_key=True)  # always 1
    document_processing_enabled = Column(Boolean, nullable=False, server_default="true")
    uploads_paused = Column(Boolean, nullable=False, server_default="false")
    incident_title = Column(String(500), nullable=True)
    incident_body = Column(Text, nullable=True)
    slo_target_percent = Column(Float, nullable=True)
    default_rate_limit_per_minute = Column(Integer, nullable=True)
    allowed_llm_models = Column(JSONB, nullable=True)
    blocked_prompt_substrings = Column(JSONB, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
