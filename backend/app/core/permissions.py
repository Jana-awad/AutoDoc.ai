from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.template import Template
from app.models.user import User
from app.core.enums import UserRole

def ensure_user_can_use_template(db: Session, user: User, template_id: int) -> Template:
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    # superadmin can use any template
    if user.role == UserRole.SUPER_ADMIN:
        return t

    # business client admin: ONLY global
    if user.role == UserRole.BUSINESS_ADMIN:
        if not t.is_global:
            raise HTTPException(status_code=403, detail="Business plan can only use global templates")
        return t

    # enterprise client admin / normal user:
    # allowed: global OR same client template
    if t.is_global:
        return t

    if user.client_id is None or t.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="You cannot use this template")

    return t
