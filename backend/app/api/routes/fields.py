from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user, require_template_management
from app.schemas.field import FieldCreate, FieldOut
from app.crud.crud_template import get_template
from app.crud.crud_field import create_field, list_fields
from app.models.user import User

router = APIRouter(prefix="/fields", tags=["fields"])


@router.post("", response_model=FieldOut)
def create(
    payload: FieldCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_template_management),
):
    t = get_template(db, payload.template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # enterprise client admin: can modify ONLY their client templates (not global)
    if user.role == "enterprise_client_admin":
        if t.is_global or t.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Cannot modify this template")

    # superadmin can modify anything
    return create_field(db, payload.template_id, payload.name, payload.field_type, payload.required)


@router.get("/template/{template_id}", response_model=list[FieldOut])
def list_for_template(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = get_template(db, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # business admin: global only
    if user.role == "business_client_admin" and not t.is_global:
        raise HTTPException(status_code=403, detail="Business plan users can only use global templates")

    # other users: can view global OR same client (unless superadmin)
    if not t.is_global and user.role != "superadmin" and t.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return list_fields(db, template_id)
