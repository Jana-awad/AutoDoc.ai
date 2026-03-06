from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import require_superadmin
from app.schemas.client import (
    ClientCreate,
    ClientOut,
    ClientListOut,
    ClientStatsOut,
    ClientDetailsOut,
    ClientUserOut,
)
from app.crud.crud_client import create_client, list_clients, get_client, delete_client, generate_api_key
from app.crud.crud_subscription import get_active_subscription, create_subscription
from app.crud.crud_plan import get_plan
from app.crud.crud_user import create_user, get_by_email
from app.core.enums import UserRole
from app.models.client import Client
from app.models.user import User
from app.models.api_log import ApiLog
from app.models.subscription import Subscription
from app.models.plan import Plan

router = APIRouter(prefix="/clients", tags=["clients"])


def _month_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _user_to_client_user_out(user: User) -> ClientUserOut:
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    role = role_value.strip().lower().replace(" ", "_")
    if role == "business_client_admin":
        role = "business_admin"
    return ClientUserOut(
        id=user.id,
        name=user.username,
        email=user.email,
        role=role,
        status="active" if user.is_active else "inactive",
    )


@router.get("/stats", response_model=ClientStatsOut)
def get_stats(db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    total_clients = db.query(Client).count()
    active_subs = (
        db.query(Subscription)
        .filter(Subscription.status == "active")
        .count()
    )
    mrr = (
        db.query(func.coalesce(func.sum(Plan.monthly_price), 0))
        .join(Subscription, Subscription.plan_id == Plan.id)
        .filter(Subscription.status == "active")
        .scalar()
    ) or 0
    business_accounts = (
        db.query(Subscription)
        .join(Plan, Subscription.plan_id == Plan.id)
        .filter(
            Subscription.status == "active",
            Plan.can_manage_templates == False,
        )
        .count()
    )
    enterprise_accounts = (
        db.query(Subscription)
        .join(Plan, Subscription.plan_id == Plan.id)
        .filter(
            Subscription.status == "active",
            Plan.can_manage_templates == True,
        )
        .count()
    )
    return ClientStatsOut(
        total_clients=total_clients,
        active_subscriptions=active_subs,
        monthly_recurring_revenue_cents=int(mrr),
        business_accounts=business_accounts,
        enterprise_accounts=enterprise_accounts,
    )


@router.get("", response_model=list[ClientListOut])
def read_all(
    db: Session = Depends(get_db),
    _super=Depends(require_superadmin),
    search: str | None = Query(None, description="Search by name, company, email"),
    plan: str | None = Query(None, description="Filter by plan name: Business, Enterprise, Trial"),
    status: str | None = Query(None, description="Filter: Active, Trial, Inactive"),
):
    month_start = _month_start()
    q = db.query(Client).order_by(Client.id.desc())
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Client.name.ilike(term),
                Client.company_name.ilike(term),
                Client.email.ilike(term),
            )
        )
    clients = q.all()
    result = []
    for c in clients:
        sub = get_active_subscription(db, c.id)
        plan_name = sub.plan.name if sub and sub.plan else None
        plan_id = sub.plan_id if sub else None
        sub_status = sub.status if sub else None
        sub_end = sub.end_date if sub else None
        user_count = db.query(User).filter(User.client_id == c.id).count()
        api_calls = (
            db.query(ApiLog)
            .filter(ApiLog.client_id == c.id, ApiLog.created_at >= month_start)
            .count()
        )
        if plan and plan.strip():
            if not plan_name or plan_name.lower() != plan.strip().lower():
                continue
        if status and status.strip():
            s = status.strip().lower()
            if s == "active":
                if not sub or sub.status != "active":
                    continue
            elif s == "trial":
                if not plan_name or "trial" not in (plan_name or "").lower():
                    continue
            elif s == "inactive":
                if sub and sub.status == "active":
                    continue
        result.append(
            ClientListOut(
                id=c.id,
                name=c.name,
                company_name=c.company_name,
                email=c.email,
                subscription_plan=plan_name,
                subscription_status=sub_status,
                subscription_end_date=sub_end,
                user_count=user_count,
                api_calls_this_month=api_calls,
                plan_id=plan_id,
            )
        )
    return result


@router.post("", response_model=ClientOut)
def create(payload: ClientCreate, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    if payload.password is not None and (not payload.password or len(payload.password) < 8):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    login_email = (payload.email or "").strip()
    if payload.password and not login_email:
        raise HTTPException(status_code=400, detail="Email is required when setting a password for the initial user")

    client = create_client(
        db,
        name=payload.name,
        company_name=payload.company_name,
        email=payload.email,
        commit=False,
    )
    db.flush()

    if payload.password and login_email:
        existing = get_by_email(db, login_email)
        if existing:
            db.rollback()
            raise HTTPException(status_code=400, detail="Email already registered")
        create_user(
            db,
            email=login_email,
            password=payload.password,
            username=payload.name,
            role=UserRole.BUSINESS_ADMIN,
            client_id=client.id,
            enforce_limits=False,
            commit=False,
        )

    if payload.plan_id is not None:
        plan = get_plan(db, payload.plan_id)
        if not plan or not plan.is_active:
            db.rollback()
            raise HTTPException(status_code=400, detail="Invalid or inactive plan_id")
        create_subscription(db, client.id, payload.plan_id, commit=False)

    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}/details", response_model=ClientDetailsOut)
def get_details(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    month_start = _month_start()
    sub = get_active_subscription(db, client_id)
    plan_name = sub.plan.name if sub and sub.plan else None
    renewal = sub.end_date if sub else None
    api_calls = (
        db.query(ApiLog)
        .filter(ApiLog.client_id == client_id, ApiLog.created_at >= month_start)
        .count()
    )
    now = datetime.now(timezone.utc)
    daily_avg = round(api_calls / max(1, now.day), 1) if api_calls else 0.0
    settings = client.settings or {}
    industry = settings.get("industry") if isinstance(settings, dict) else None
    country = settings.get("country") if isinstance(settings, dict) else None
    users = (
        db.query(User).filter(User.client_id == client_id).order_by(User.id.asc()).all()
    )
    return ClientDetailsOut(
        id=client.id,
        name=client.name,
        company_name=client.company_name,
        email=client.email,
        api_key=client.api_key,
        industry=industry,
        country=country,
        subscription_id=sub.id if sub else None,
        plan_id=sub.plan_id if sub else None,
        plan_name=plan_name,
        subscription_status=sub.status if sub else None,
        billing_cycle="Monthly",
        renewal_date=renewal,
        payment_status="paid" if sub else None,
        api_calls_this_month=api_calls,
        api_quota=None,
        daily_average_api_calls=daily_avg,
        users=[_user_to_client_user_out(u) for u in users],
    )


@router.get("/{client_id}/users", response_model=list[ClientUserOut])
def get_client_users(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    users = db.query(User).filter(User.client_id == client_id).order_by(User.id.asc()).all()
    return [_user_to_client_user_out(u) for u in users]


@router.post("/{client_id}/reset-api-key", response_model=ClientOut)
def reset_api_key(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client.api_key = generate_api_key()
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
def delete_one(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    """Delete client and all related data (users, subscriptions, payments, documents, templates, api_logs)."""
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    delete_client(db, client)
    return None


@router.get("/{client_id}", response_model=ClientOut)
def read_one(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
