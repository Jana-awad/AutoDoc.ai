"""Singleton row ``platform_config`` id=1 — operator kill switches and governance."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.platform_config import PlatformConfig


def get_platform_config(db: Session) -> PlatformConfig:
    row = db.query(PlatformConfig).filter(PlatformConfig.id == 1).first()
    if row is None:
        row = PlatformConfig(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_platform_config(
    db: Session,
    *,
    document_processing_enabled: bool | None = None,
    uploads_paused: bool | None = None,
    incident_title: str | None = None,
    incident_body: str | None = None,
    slo_target_percent: float | None = None,
    default_rate_limit_per_minute: int | None = None,
    allowed_llm_models: list | None = None,
    blocked_prompt_substrings: list | None = None,
    updated_by_user_id: int | None = None,
) -> PlatformConfig:
    row = get_platform_config(db)
    if document_processing_enabled is not None:
        row.document_processing_enabled = document_processing_enabled
    if uploads_paused is not None:
        row.uploads_paused = uploads_paused
    if incident_title is not None:
        row.incident_title = incident_title
    if incident_body is not None:
        row.incident_body = incident_body
    if slo_target_percent is not None:
        row.slo_target_percent = slo_target_percent
    if default_rate_limit_per_minute is not None:
        row.default_rate_limit_per_minute = default_rate_limit_per_minute
    if allowed_llm_models is not None:
        row.allowed_llm_models = allowed_llm_models
    if blocked_prompt_substrings is not None:
        row.blocked_prompt_substrings = blocked_prompt_substrings
    if updated_by_user_id is not None:
        row.updated_by_user_id = updated_by_user_id
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
