"""HTTP endpoints for the Template Builder.

Endpoints fall into two groups:

* Legacy CRUD (``POST /templates``, ``PUT /templates/{id}``, ...) — kept so the
  enterprise/business UIs that just edit name/description keep working.
* Builder API (``POST /templates/builder``, ``PUT /templates/{id}/builder``,
  ``GET /templates/{id}/full``, ``POST /templates/upload``,
  ``POST /templates/{id}/generate``) — used by the Super Admin Template Builder.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_template_management
from app.core.enums import UserRole
from app.crud.crud_field import (
    delete_fields_for_template as delete_fields_for_template_crud,
    list_fields,
)
from app.crud.crud_template import (
    count_fields,
    create_template,
    delete_template,
    get_template,
    list_templates_for_user,
    serialize_template_for_builder,
    update_template,
    upsert_template_from_builder,
)
from app.db.deps import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import (
    TemplateBuilderOut,
    TemplateBuilderPayload,
    TemplateCreate,
    TemplateGenerateRequest,
    TemplateGenerateResponse,
    TemplateOut,
    TemplateUpdate,
)
from app.services.llm_extraction import generate_from_template

router = APIRouter(prefix="/templates", tags=["templates"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_template_out(db: Session, t: Template) -> dict[str, Any]:
    return {
        "id": t.id,
        "template_key": t.template_key,
        "client_id": t.client_id,
        "is_global": bool(t.is_global),
        "name": t.name,
        "description": t.description,
        "document_type": t.document_type,
        "language": t.language,
        "status": t.status,
        "version": t.version,
        "fields_count": count_fields(db, t.id),
        "created_by": t.created_by,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


def _ensure_can_view_template(user: User, t: Template) -> None:
    """Raise 403 if the calling user is not allowed to *read* the template."""
    if user.role == UserRole.BUSINESS_ADMIN and not t.is_global:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business plan users can only use global templates",
        )

    if (
        not t.is_global
        and user.role != UserRole.SUPER_ADMIN
        and t.client_id != user.client_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _ensure_can_modify_template(user: User, t: Template) -> None:
    """Raise 403 if the calling user is not allowed to *modify* the template."""
    if user.role == UserRole.SUPER_ADMIN:
        return
    if user.role == UserRole.ENTERPRISE_ADMIN:
        if t.is_global or t.client_id != user.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify this template",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not allowed to modify templates",
    )


def _normalize_builder_payload(
    payload: TemplateBuilderPayload, user: User
) -> dict[str, Any]:
    """Apply role-based defaults and convert the pydantic payload into a dict."""
    template_dict = payload.template.model_dump()
    fields_dict = [f.model_dump() for f in payload.fields]
    ai_config_dict = payload.ai_config.model_dump()

    # Role defaults: enterprise admins always bind to their client, never global.
    if user.role == UserRole.ENTERPRISE_ADMIN:
        template_dict["is_global"] = False
        template_dict["client_id"] = user.client_id
    elif user.role == UserRole.SUPER_ADMIN:
        # Super admin defaults to a global template unless they explicitly bound
        # it to a client.
        if template_dict.get("client_id") is None:
            template_dict["is_global"] = bool(template_dict.get("is_global", True))

    return {
        "template": template_dict,
        "fields": fields_dict,
        "ai_config": ai_config_dict,
    }


# ---------------------------------------------------------------------------
# Builder endpoints
# ---------------------------------------------------------------------------


@router.post("/builder", response_model=TemplateBuilderOut)
def create_template_from_builder(
    payload: TemplateBuilderPayload,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    """Create a brand-new template from the Template Builder UI."""
    payload_dict = _normalize_builder_payload(payload, user)
    try:
        template = upsert_template_from_builder(
            db, payload=payload_dict, actor=user, template_id=None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_template_for_builder(db, template)


@router.put("/{template_id}/builder", response_model=TemplateBuilderOut)
def update_template_from_builder(
    template_id: int,
    payload: TemplateBuilderPayload,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    """Replace a template (and its fields + AI config) from the builder UI."""
    template = get_template(db, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    _ensure_can_modify_template(user, template)

    payload_dict = _normalize_builder_payload(payload, user)
    try:
        template = upsert_template_from_builder(
            db, payload=payload_dict, actor=user, template_id=template.id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_template_for_builder(db, template)


@router.get("/{template_id}/full", response_model=TemplateBuilderOut)
def read_full_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return a template plus all of its fields and AI config (for editing)."""
    template = get_template(db, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_view_template(user, template)
    return serialize_template_for_builder(db, template)


@router.post(
    "/upload",
    response_model=TemplateBuilderOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_template_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    """Import a template from a JSON file produced by the builder (or by hand).

    Accepts either:
      * a full builder payload ``{ "template": {...}, "fields": [...], "ai_config": {...} }``
      * a flat object that has top-level ``name`` and ``fields`` (we'll best-effort
        coerce it into the builder shape).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(
            status_code=400, detail="Only .json template files are supported"
        )

    raw = await file.read()
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid JSON file: {exc}"
        ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail="Template file must be a JSON object at the top level",
        )

    # Coerce to builder shape if the file is flat.
    if "template" not in data and "name" in data:
        flat = data
        data = {
            "template": {
                "template_key": flat.get("template_key"),
                "name": flat.get("name"),
                "description": flat.get("description"),
                "document_type": flat.get("document_type"),
                "language": flat.get("language", "en"),
                "status": flat.get("status", "active"),
                "version": flat.get("version", "1.0.0"),
                "is_global": bool(flat.get("is_global", True)),
                "client_id": flat.get("client_id"),
            },
            "fields": flat.get("fields") or [],
            "ai_config": flat.get("ai_config") or {},
        }

    try:
        payload = TemplateBuilderPayload.model_validate(data)
    except Exception as exc:  # pydantic ValidationError → 400 with detail
        raise HTTPException(
            status_code=400, detail=f"Invalid template structure: {exc}"
        ) from exc

    payload_dict = _normalize_builder_payload(payload, user)
    try:
        template = upsert_template_from_builder(
            db, payload=payload_dict, actor=user, template_id=None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_template_for_builder(db, template)


@router.post("/{template_id}/generate", response_model=TemplateGenerateResponse)
def generate_with_template(
    template_id: int,
    payload: TemplateGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Run the LLM with the template prompts against optional sample text.

    Useful from the builder to test prompts without uploading a real PDF."""
    template = get_template(db, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_view_template(user, template)

    try:
        return generate_from_template(
            db=db,
            template=template,
            document_text=payload.document_text or "",
            variables=payload.variables or {},
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Lightweight CRUD (legacy)
# ---------------------------------------------------------------------------


@router.post("", response_model=TemplateOut)
def create(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    if payload.is_global:
        if user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=403, detail="Only superadmin can create global templates"
            )
        if payload.client_id is not None:
            raise HTTPException(
                status_code=400, detail="Global template must not have client_id"
            )
        t = create_template(
            db,
            payload.name,
            payload.description,
            None,
            True,
            template_key=payload.template_key,
            document_type=payload.document_type,
            language=payload.language or "en",
            status=payload.status or "active",
            version=payload.version or "1.0.0",
            created_by=user.id,
        )
        return _to_template_out(db, t)

    if payload.client_id is None:
        raise HTTPException(
            status_code=400, detail="client_id is required for non-global templates"
        )
    if user.role == UserRole.ENTERPRISE_ADMIN and payload.client_id != user.client_id:
        raise HTTPException(
            status_code=403,
            detail="Enterprise admin can only create templates for their own client",
        )

    t = create_template(
        db,
        payload.name,
        payload.description,
        payload.client_id,
        False,
        template_key=payload.template_key,
        document_type=payload.document_type,
        language=payload.language or "en",
        status=payload.status or "active",
        version=payload.version or "1.0.0",
        created_by=user.id,
    )
    return _to_template_out(db, t)


@router.get("", response_model=list[TemplateOut])
def list_mine(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = list_templates_for_user(db, user)
    return [_to_template_out(db, t) for t in items]


@router.get("/accessible", response_model=list[TemplateOut])
def list_accessible(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Templates the current user may use (same rules as GET /templates)."""
    items = list_templates_for_user(db, user)
    return [_to_template_out(db, t) for t in items]


@router.get("/{template_id}", response_model=TemplateOut)
def read_one(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_view_template(user, t)
    return _to_template_out(db, t)


@router.delete("/{template_id}")
def delete_template_route(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_modify_template(user, t)
    delete_template(db, t)
    return {"detail": "Template deleted"}


@router.put("/{template_id}", response_model=TemplateOut)
def update_template_route(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_modify_template(user, t)

    name = payload.name if payload.name is not None else t.name
    description = payload.description if payload.description is not None else t.description
    is_global = payload.is_global if payload.is_global is not None else t.is_global

    if is_global and user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403, detail="Only superadmin can create global templates"
        )

    if is_global:
        t = update_template(db, t, name, description, True)
        t.client_id = None
    else:
        if (
            payload.client_id is not None
            and user.role == UserRole.SUPER_ADMIN
        ):
            t.client_id = payload.client_id
        t = update_template(db, t, name, description, False)

    # Optional metadata updates (template_key, doc type, language, status, version).
    for attr in ("template_key", "document_type", "language", "status", "version"):
        value = getattr(payload, attr, None)
        if value is not None:
            setattr(t, attr, value)

    db.add(t)
    db.commit()
    db.refresh(t)
    return _to_template_out(db, t)


@router.get("/{template_id}/fields")
def list_fields_for_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_view_template(user, t)
    return list_fields(db, template_id)


@router.delete("/{template_id}/fields")
def delete_fields_for_template_route(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _ensure_can_modify_template(user, t)
    delete_fields_for_template_crud(db, template_id)
    return {"detail": "Fields deleted"}
