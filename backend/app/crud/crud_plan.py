from sqlalchemy.orm import Session
from app.models.plan import Plan


def ensure_default_plans(db: Session) -> None:
    """Ensure at least Business and Enterprise plans exist (for dropdowns and signup)."""
    business = (
        db.query(Plan)
        .filter(Plan.is_active == True, Plan.can_manage_templates == False)
        .order_by(Plan.id.asc())
        .first()
    )
    enterprise = (
        db.query(Plan)
        .filter(Plan.is_active == True, Plan.can_manage_templates == True)
        .order_by(Plan.id.asc())
        .first()
    )
    if not business:
        business = Plan(
            name="Business",
            monthly_price=4900,
            max_users=10,
            allow_creation=True,
            is_active=True,
            can_manage_templates=False,
        )
        db.add(business)
    if not enterprise:
        enterprise = Plan(
            name="Enterprise",
            monthly_price=9900,
            max_users=50,
            allow_creation=True,
            is_active=True,
            can_manage_templates=True,
        )
        db.add(enterprise)
    if not business.id or not enterprise.id:
        db.commit()
        if not business.id:
            db.refresh(business)
        if not enterprise.id:
            db.refresh(enterprise)


def list_active_plans(db: Session) -> list[Plan]:
    ensure_default_plans(db)
    return db.query(Plan).filter(Plan.is_active == True).order_by(Plan.id.asc()).all()


def get_plan(db: Session, plan_id: int) -> Plan | None:
    return db.query(Plan).filter(Plan.id == plan_id).first()
