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


def create_plan(
    db: Session,
    name: str,
    monthly_price: int,
    max_users: int,
    allow_creation: bool,
    can_manage_templates: bool,
    is_active: bool,
) -> Plan:
    p = Plan(
        name=name,
        monthly_price=monthly_price,
        max_users=max_users,
        allow_creation=allow_creation,
        can_manage_templates=can_manage_templates,
        is_active=is_active,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def list_active_plans(db: Session) -> list[Plan]:
    ensure_default_plans(db)
    return db.query(Plan).filter(Plan.is_active == True).order_by(Plan.id.asc()).all()


def list_plans(db: Session) -> list[Plan]:
    return db.query(Plan).order_by(Plan.id.asc()).all()


def get_plan(db: Session, plan_id: int) -> Plan | None:
    return db.query(Plan).filter(Plan.id == plan_id).first()


def update_plan(
    db: Session,
    plan: Plan,
    name: str | None,
    monthly_price: int | None,
    max_users: int | None,
    allow_creation: bool | None,
    can_manage_templates: bool | None,
    is_active: bool | None,
) -> Plan:
    if name is not None:
        plan.name = name
    if monthly_price is not None:
        plan.monthly_price = monthly_price
    if max_users is not None:
        plan.max_users = max_users
    if allow_creation is not None:
        plan.allow_creation = allow_creation
    if can_manage_templates is not None:
        plan.can_manage_templates = can_manage_templates
    if is_active is not None:
        plan.is_active = is_active
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def delete_plan(db: Session, plan: Plan) -> None:
    db.delete(plan)
    db.commit()
