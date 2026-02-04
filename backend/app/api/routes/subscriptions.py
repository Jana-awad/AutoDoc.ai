from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user, require_superadmin
from app.schemas.subscription import SubscriptionCreate, SubscriptionOut
from app.crud.crud_subscription import (
    get_active_subscription,
    create_subscription,
    cancel_subscription,
    change_subscription_plan,
)
from app.crud.crud_plan import get_plan
from app.crud.crud_payment import create_payment
from app.models.user import User
from app.models.subscription import Subscription

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.get("/me", response_model=SubscriptionOut)
def my_subscription(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "superadmin" and user.client_id is None:
        raise HTTPException(status_code=400, detail="User has no client")
    client_id = user.client_id
    if client_id is None:
        raise HTTPException(status_code=400, detail="Superadmin has no client_id; use admin endpoints")

    sub = get_active_subscription(db, client_id)
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    return sub

@router.post("", response_model=SubscriptionOut)
def create_for_client(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    plan = get_plan(db, payload.plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=400, detail="Invalid plan_id")

    existing = get_active_subscription(db, payload.client_id)
    if existing:
        raise HTTPException(status_code=400, detail="Client already has an active subscription")

    sub = create_subscription(db, payload.client_id, payload.plan_id)

    # mock payment created automatically
    create_payment(db, client_id=payload.client_id, subscription_id=sub.id, status="paid")

    return sub

@router.post("/{subscription_id}/cancel", response_model=SubscriptionOut)
def cancel(
    subscription_id: int,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return cancel_subscription(db, sub)

@router.post("/change-plan", response_model=SubscriptionOut)
def change_plan(
    client_id: int,
    new_plan_id: int,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    plan = get_plan(db, new_plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=400, detail="Invalid plan_id")

    sub = change_subscription_plan(db, client_id, new_plan_id)
    create_payment(db, client_id=client_id, subscription_id=sub.id, status="paid")
    return sub
