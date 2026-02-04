from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user, require_template_management
from app.schemas.template import TemplateCreate, TemplateOut
from app.crud.crud_template import create_template, get_template, list_templates_for_user
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateOut)
def create(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    # Only superadmin can create GLOBAL templates
    if payload.is_global:
        if user.role != "superadmin":
            raise HTTPException(status_code=403, detail="Only superadmin can create global templates")
        if payload.client_id is not None:
            raise HTTPException(status_code=400, detail="Global template must not have client_id")
        return create_template(db, payload.name, payload.description, None, True)

    # Client template must have client_id
    if payload.client_id is None:
        raise HTTPException(status_code=400, detail="client_id is required for non-global templates")

    # Enterprise client admin can only create for their own client
    if user.role == "enterprise_client_admin" and payload.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Enterprise admin can only create templates for their own client")

    return create_template(db, payload.name, payload.description, payload.client_id, False)


@router.get("", response_model=list[TemplateOut])
def list_mine(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list_templates_for_user(db, user)


@router.get("/{template_id}", response_model=TemplateOut)
def read_one(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # Business client admin: can access only global templates
    if user.role == "business_client_admin" and not t.is_global:
        raise HTTPException(status_code=403, detail="Business plan users can only use global templates")

    # Non-global must match client (unless superadmin)
    if not t.is_global and user.role != "superadmin" and t.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return t
