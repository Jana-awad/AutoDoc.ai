from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.super_audit_log import SuperAuditLog


def append_super_audit(
    db: Session,
    *,
    user_id: int,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    detail: str | None = None,
    payload: dict | None = None,
) -> SuperAuditLog:
    row = SuperAuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        payload=payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
