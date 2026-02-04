from sqlalchemy.orm import Session
from app.models.plan import Plan

def list_active_plans(db: Session) -> list[Plan]:
    return db.query(Plan).filter(Plan.is_active == True).order_by(Plan.id.asc()).all()

def get_plan(db: Session, plan_id: int) -> Plan | None:
    return db.query(Plan).filter(Plan.id == plan_id).first()
