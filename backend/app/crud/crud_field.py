from sqlalchemy.orm import Session
from app.models.field import Field

def create_field(db: Session, template_id: int, name: str, field_type: str | None, required: bool) -> Field:
    f = Field(template_id=template_id, name=name, field_type=field_type, required=required)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

def list_fields(db: Session, template_id: int) -> list[Field]:
    return db.query(Field).filter(Field.template_id == template_id).order_by(Field.id.asc()).all()

def delete_fields_for_template(db: Session, template_id: int) -> None:
    db.query(Field).filter(Field.template_id == template_id).delete()
    db.commit()

def delete_field(db: Session, field: Field) -> None:
    db.delete(field)
    db.commit()

def get_field(db: Session, field_id: int) -> Field | None:
    return db.query(Field).filter(Field.id == field_id).first()
def update_field(db: Session, field: Field, name: str, field_type: str | None, required: bool) -> Field:
    field.name = name
    field.field_type = field_type
    field.required = required
    db.add(field)
    db.commit()
    db.refresh(field)
    return field
