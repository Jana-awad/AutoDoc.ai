from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.template import Template
from app.models.user import User

def create_template(db: Session, name: str, description: str | None, client_id: int | None, is_global: bool) -> Template:
    t = Template(name=name, description=description, client_id=client_id, is_global=is_global)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

def get_template(db: Session, template_id: int) -> Template | None:
    return db.query(Template).filter(Template.id == template_id).first()

def list_templates_for_user(db: Session, user: User) -> list[Template]:
    # Business client admin: GLOBAL ONLY
    if user.role == "business_client_admin":
        return db.query(Template).filter(Template.is_global == True).order_by(Template.id.desc()).all()

    # Enterprise client admin + normal users: global + their client templates
    if user.client_id is not None:
        return db.query(Template).filter(
            or_(Template.is_global == True, Template.client_id == user.client_id)
        ).order_by(Template.id.desc()).all()

    # Platform admin with no client: see all
    return db.query(Template).order_by(Template.id.desc()).all()

def delete_template(db: Session, template: Template) -> None:
    db.delete(template)
    db.commit()