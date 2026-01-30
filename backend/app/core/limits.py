from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.crud.crud_subscription import get_active_subscription


def ensure_client_can_add_user(db: Session, client_id: int) -> None:
    sub = get_active_subscription(db, client_id)
    if not sub or not sub.plan:
        raise HTTPException(status_code=403, detail="Client has no active subscription")

    max_users = sub.plan.max_users

    # treat very large as unlimited (or if you later allow NULL)
    if max_users is None or max_users >= 100000:
        return

    current_count = (
        db.query(func.count(User.id))
        .filter(User.client_id == client_id)
        .scalar()
    ) or 0

    if current_count >= max_users:
        raise HTTPException(
            status_code=403,
            detail=f"User limit reached for your plan (max {max_users})",
        )
