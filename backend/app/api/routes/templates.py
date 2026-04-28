from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user, require_template_management
from app.schemas.template import TemplateCreate, TemplateOut, TemplateUpdate
from app.crud.crud_template import create_template, get_template, list_templates_for_user, update_template, delete_template
from app.crud.crud_field import list_fields, delete_fields_for_template as delete_fields_for_template_crud
from app.models.user import User
from app.core.enums import UserRole

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateOut)
def create(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    # Only superadmin can create GLOBAL templates
    if payload.is_global:
        if user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only superadmin can create global templates")
        if payload.client_id is not None:
            raise HTTPException(status_code=400, detail="Global template must not have client_id")
        return create_template(db, payload.name, payload.description, None, True)

    # Client template must have client_id
    if payload.client_id is None:
        raise HTTPException(status_code=400, detail="client_id is required for non-global templates")

    # Enterprise client admin can only create for their own client
    if user.role == UserRole.ENTERPRISE_ADMIN and payload.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Enterprise admin can only create templates for their own client")

    return create_template(db, payload.name, payload.description, payload.client_id, False)


@router.get("", response_model=list[TemplateOut])
def list_mine(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list_templates_for_user(db, user)


@router.get("/accessible", response_model=list[TemplateOut])
def list_accessible(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Templates the current user may use (same rules as GET /templates)."""
    return list_templates_for_user(db, user)


@router.get("/{template_id}", response_model=TemplateOut)
def read_one(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # Business client admin: can access only global templates
    if user.role == UserRole.BUSINESS_ADMIN and not t.is_global:
        raise HTTPException(status_code=403, detail="Business plan users can only use global templates")

    # Non-global must match client (unless superadmin)
    if not t.is_global and user.role != UserRole.SUPER_ADMIN and t.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return t


@router.delete("/{template_id}")
def delete_template_route(template_id: int, db: Session = Depends(get_db), user: User = Depends(require_template_management)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # Enterprise client admin: can only delete their own client templates (not global)
    if user.role == UserRole.ENTERPRISE_ADMIN:
        if t.is_global or t.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Cannot delete this template")

    # Superadmin can delete anything
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

    # Enterprise client admin: can only update their own client templates (not global)
    if user.role == UserRole.ENTERPRISE_ADMIN:
        if t.is_global or t.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Cannot modify this template")

    # Superadmin can update anything
    name = payload.name if payload.name is not None else t.name
    description = payload.description if payload.description is not None else t.description
    is_global = payload.is_global if payload.is_global is not None else t.is_global

    # Only superadmin can switch to global
    if is_global and user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only superadmin can create global templates")

    # If switching to global, client_id must be None
    if is_global:
        t = update_template(db, t, name, description, True)
        t.client_id = None
        db.add(t)
        db.commit()
        db.refresh(t)
        return t

    # Non-global template: allow superadmin to update client_id if provided
    if payload.client_id is not None and user.role == UserRole.SUPER_ADMIN:
        t.client_id = payload.client_id
        db.add(t)
        db.commit()
        db.refresh(t)

    return update_template(db, t, name, description, False)


@router.get("/{template_id}/fields")
def list_fields_for_template(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # business admin: global only
    if user.role == UserRole.BUSINESS_ADMIN and not t.is_global:
        raise HTTPException(status_code=403, detail="Business plan users can only access global templates")
    # other users: can view global OR same client (unless superadmin)
    if not t.is_global and user.role != UserRole.SUPER_ADMIN and t.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return list_fields(db, template_id)


@router.delete("/{template_id}/fields")
def delete_fields_for_template_route(template_id: int, db: Session = Depends(get_db), user: User = Depends(require_template_management)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # Enterprise client admin: can only delete fields for their own client templates (not global)
    if user.role == UserRole.ENTERPRISE_ADMIN:
        if t.is_global or t.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Cannot modify this template")

    # Superadmin can delete fields for any template
    delete_fields_for_template_crud(db, template_id)
    return {"detail": "Fields deleted"}
