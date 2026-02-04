from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.subscription import Subscription
from app.models.plan import Plan

def get_active_subscription(db: Session, client_id: int) -> Subscription | None:
    return (
        db.query(Subscription)
        .filter(Subscription.client_id == client_id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )

def create_subscription(db: Session, client_id: int, plan_id: int) -> Subscription:
    sub = Subscription(
        client_id=client_id,
        plan_id=plan_id,
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=None,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
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
