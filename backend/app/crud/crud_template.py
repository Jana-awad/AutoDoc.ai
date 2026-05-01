"""CRUD helpers for templates and the bulk Template Builder save."""
from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models.field import Field
from app.models.template import Template
from app.models.user import User


# ---------------------------------------------------------------------------
# Light-weight CRUD (kept for backward compat with enterprise/business UIs)
# ---------------------------------------------------------------------------


def create_template(
    db: Session,
    name: str,
    description: str | None,
    client_id: int | None,
    is_global: bool,
    *,
    template_key: str | None = None,
    document_type: str | None = None,
    language: str | None = "en",
    status: str | None = "active",
    version: str | None = "1.0.0",
    created_by: int | None = None,
) -> Template:
    t = Template(
        name=name,
        description=description,
        client_id=client_id,
        is_global=is_global,
        template_key=template_key,
        document_type=document_type,
        language=language,
        status=status,
        version=version,
        created_by=created_by,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def get_template(db: Session, template_id: int) -> Template | None:
    return db.query(Template).filter(Template.id == template_id).first()


def get_template_by_key(db: Session, key: str) -> Template | None:
    return db.query(Template).filter(Template.template_key == key).first()


def list_templates_for_user(db: Session, user: User) -> list[Template]:
    """Visibility:
    - business_admin: only global templates
    - enterprise_admin / regular user with client_id: global + client templates
    - super_admin / no client: every template
    """
    if user.role == UserRole.BUSINESS_ADMIN:
        return (
            db.query(Template)
            .filter(Template.is_global.is_(True))
            .order_by(Template.id.desc())
            .all()
        )

    if user.client_id is not None:
        return (
            db.query(Template)
            .filter(or_(Template.is_global.is_(True), Template.client_id == user.client_id))
            .order_by(Template.id.desc())
            .all()
        )

    return db.query(Template).order_by(Template.id.desc()).all()


def delete_template(db: Session, template: Template) -> None:
    db.delete(template)
    db.commit()


def update_template(
    db: Session,
    template: Template,
    name: str,
    description: str | None,
    is_global: bool,
) -> Template:
    template.name = name
    template.description = description
    template.is_global = is_global
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def count_fields(db: Session, template_id: int) -> int:
    return (
        db.query(func.count(Field.id))
        .filter(Field.template_id == template_id)
        .scalar()
        or 0
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify_template_key(name: str, *, fallback: str | None = None) -> str:
    """Return a safe, human-readable identifier from a template name."""
    base = _SLUG_RE.sub("_", (name or "").strip().lower()).strip("_")
    if not base:
        base = (fallback or "template").lower()
    return base[:80]


def ensure_unique_template_key(
    db: Session, candidate: str, *, exclude_id: int | None = None
) -> str:
    """Return a key that is unique across the templates table.

    If the candidate is taken we append ``_<short-uuid>`` so the user's
    preference is preserved when possible without colliding."""
    if not candidate:
        candidate = "template"

    base = candidate
    attempt = 0
    while True:
        query = db.query(Template).filter(Template.template_key == candidate)
        if exclude_id is not None:
            query = query.filter(Template.id != exclude_id)
        existing = query.first()
        if existing is None:
            return candidate
        attempt += 1
        suffix = uuid.uuid4().hex[:6]
        candidate = f"{base}_{suffix}"
        if attempt > 5:  # extremely unlikely; bail out with a fully random key
            return f"{base}_{uuid.uuid4().hex[:10]}"


# ---------------------------------------------------------------------------
# Builder payload (full template upsert with fields + AI config)
# ---------------------------------------------------------------------------


def _serialize_template(template: Template) -> dict[str, Any]:
    return {
        "template_key": template.template_key,
        "name": template.name,
        "description": template.description,
        "document_type": template.document_type,
        "language": template.language or "en",
        "status": template.status or "active",
        "version": template.version or "1.0.0",
        "is_global": bool(template.is_global),
        "client_id": template.client_id,
    }


def _serialize_ai_config(template: Template) -> dict[str, Any]:
    return {
        "system_prompt": template.system_prompt,
        "extraction_instructions": template.extraction_instructions,
        "output_format_rules": template.output_format_rules,
        "json_output_template": template.json_output_template,
        "edge_case_handling_rules": template.edge_case_handling_rules,
        "llm_model": template.llm_model,
        "llm_temperature": (
            float(template.llm_temperature) if template.llm_temperature is not None else None
        ),
        "llm_max_tokens": template.llm_max_tokens,
    }


def _serialize_field(f: Field) -> dict[str, Any]:
    return {
        "id": f.id,
        "template_id": f.template_id,
        "name": f.name,
        "display_label": f.label,
        "data_type": f.field_type or "string",
        "required": bool(f.required),
        "document_position": f.positioning_hint,
        "extraction_hint": f.extraction_prompt,
        "example_value": f.example_value,
        "validation_rules": f.format_hint,
        "field_order": f.field_order or 0,
    }


def serialize_template_for_builder(db: Session, template: Template) -> dict[str, Any]:
    """Shape the full builder response (template + fields + ai_config)."""
    fields = (
        db.query(Field)
        .filter(Field.template_id == template.id)
        .order_by(Field.field_order.asc().nulls_last(), Field.id.asc())
        .all()
    )

    return {
        "id": template.id,
        "template": _serialize_template(template),
        "fields": [_serialize_field(f) for f in fields],
        "ai_config": _serialize_ai_config(template),
        "created_by": template.created_by,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
    }


def _apply_template_block(template: Template, block: dict[str, Any]) -> None:
    """Mutate ``template`` with values from the builder template block."""
    for attr in (
        "name",
        "description",
        "document_type",
        "language",
        "status",
        "version",
    ):
        if attr in block and block[attr] is not None:
            setattr(template, attr, block[attr])

    if "is_global" in block and block["is_global"] is not None:
        template.is_global = bool(block["is_global"])

    if "client_id" in block:
        template.client_id = block["client_id"]


def _apply_ai_config(template: Template, ai_config: dict[str, Any]) -> None:
    for attr in (
        "system_prompt",
        "extraction_instructions",
        "output_format_rules",
        "json_output_template",
        "edge_case_handling_rules",
        "llm_model",
        "llm_max_tokens",
    ):
        if attr in ai_config:
            setattr(template, attr, ai_config[attr])

    if "llm_temperature" in ai_config:
        template.llm_temperature = ai_config["llm_temperature"]


def _replace_fields(db: Session, template: Template, fields_payload: list[dict[str, Any]]) -> None:
    """Drop existing fields and replace them with the payload version."""
    db.query(Field).filter(Field.template_id == template.id).delete(synchronize_session=False)
    db.flush()

    for index, raw in enumerate(fields_payload):
        field_name = (raw.get("name") or "").strip()
        if not field_name:
            continue  # skip blank rows; the UI may submit an empty card
        f = Field(
            template_id=template.id,
            name=field_name,
            label=(raw.get("display_label") or "").strip() or None,
            field_type=(raw.get("data_type") or "string").strip() or "string",
            required=bool(raw.get("required", False)),
            description=(raw.get("extraction_hint") or "").strip() or None,
            extraction_prompt=(raw.get("extraction_hint") or "").strip() or None,
            positioning_hint=(raw.get("document_position") or "").strip() or None,
            format_hint=(raw.get("validation_rules") or "").strip() or None,
            example_value=(raw.get("example_value") or "").strip() or None,
            field_order=int(raw.get("field_order", index) or index),
        )
        db.add(f)


def upsert_template_from_builder(
    db: Session,
    *,
    payload: dict[str, Any],
    actor: User,
    template_id: int | None = None,
) -> Template:
    """Create or update a template using the full Template Builder payload.

    Returns the saved (and refreshed) ORM ``Template`` instance.
    """
    template_block = dict(payload.get("template") or {})
    fields_payload = list(payload.get("fields") or [])
    ai_config = dict(payload.get("ai_config") or {})

    name = (template_block.get("name") or "").strip()
    if not name:
        raise ValueError("Template name is required")

    requested_key = (template_block.get("template_key") or "").strip() or None

    if template_id is not None:
        template = get_template(db, template_id)
        if template is None:
            raise LookupError(f"Template {template_id} not found")
    else:
        template = Template(
            name=name,
            client_id=template_block.get("client_id"),
            is_global=bool(template_block.get("is_global", True)),
            created_by=actor.id,
        )
        db.add(template)
        db.flush()  # assigns template.id without committing yet

    if requested_key:
        candidate = slugify_template_key(requested_key, fallback=name)
    else:
        candidate = template.template_key or slugify_template_key(name)
    template.template_key = ensure_unique_template_key(
        db, candidate, exclude_id=template.id
    )

    _apply_template_block(template, template_block)
    _apply_ai_config(template, ai_config)

    _replace_fields(db, template, fields_payload)

    db.add(template)
    db.commit()
    db.refresh(template)
    return template
