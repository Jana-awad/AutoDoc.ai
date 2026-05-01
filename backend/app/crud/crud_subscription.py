from datetime import datetime, timedelta, timezone
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.crud.crud_plan import list_active_plans


ALWAYS_ACTIVE_EMAIL = "ch@seniore.com"


def _is_always_active_client(db: Session, client_id: int) -> bool:
    return (
        db.query(User)
        .filter(
            User.client_id == client_id,
            func.lower(User.email) == ALWAYS_ACTIVE_EMAIL.lower(),
        )
        .first()
        is not None
    )


def _ensure_default_plans(db: Session) -> tuple[Plan, Plan]:
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

    return business, enterprise


def _resolve_business_plan(db: Session) -> Plan | None:
    plans = [plan for plan in list_active_plans(db) if plan.allow_creation]
    if not plans:
        plans = list_active_plans(db)
    if not plans:
        business, _enterprise = _ensure_default_plans(db)
        return business

    for plan in plans:
        if "business" in plan.name.lower():
            return plan

    for plan in plans:
        if not plan.can_manage_templates:
            return plan

    return plans[0]


def _ensure_always_active_subscription(db: Session, client_id: int) -> Subscription | None:
    """Keep subscription always active for the always-active email (e.g. ch@seniore.com enterprise account)."""
    now = datetime.now(timezone.utc)
    sub = (
        db.query(Subscription)
        .filter(Subscription.client_id == client_id)
        .order_by(Subscription.id.desc())
        .first()
    )
    if sub:
        if sub.status != "active" or (sub.end_date and sub.end_date <= now):
            sub.status = "active"
            sub.end_date = None
            db.add(sub)
            db.commit()
            db.refresh(sub)
        return sub

    # No subscription yet: create one on Enterprise plan for always-active account
    _business, enterprise = _ensure_default_plans(db)
    plan = enterprise
    if not plan:
        return None
    return create_subscription(db, client_id, plan.id)


def get_active_subscription(db: Session, client_id: int) -> Subscription | None:
    now = datetime.now(timezone.utc)
    if _is_always_active_client(db, client_id):
        return _ensure_always_active_subscription(db, client_id)
    return (
        db.query(Subscription)
        .filter(
            Subscription.client_id == client_id,
            Subscription.status == "active",
            or_(Subscription.end_date.is_(None), Subscription.end_date > now),
        )
        .order_by(Subscription.id.desc())
        .first()
    )


def create_subscription(
    db: Session,
    client_id: int,
    plan_id: int,
    duration_days: int | None = None,
    commit: bool = True,
) -> Subscription:
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=duration_days) if duration_days else None
    sub = Subscription(
        client_id=client_id,
        plan_id=plan_id,
        status="active",
        start_date=start_date,
        end_date=end_date,
    )
    db.add(sub)
    if commit:
        db.commit()
        db.refresh(sub)
    else:
        db.flush()
    return sub


def cancel_subscription(db: Session, sub: Subscription) -> Subscription:
    sub.status = "canceled"
    sub.end_date = datetime.now(timezone.utc)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def change_subscription_plan(db: Session, client_id: int, new_plan_id: int) -> Subscription:
    # cancel old active subscription if exists
    current = get_active_subscription(db, client_id)
    if current:
        cancel_subscription(db, current)

    # create new subscription
    return create_subscription(db, client_id, new_plan_id)
