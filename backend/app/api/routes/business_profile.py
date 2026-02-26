from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import require_business_admin
from app.crud.crud_subscription import change_subscription_plan, get_active_subscription
from app.crud.crud_plan import get_plan, list_active_plans
from app.crud.crud_payment import create_payment, delete_payments_for_client, list_payments_for_client
from app.models.api_log import ApiLog
from app.models.client import Client
from app.models.document import Document
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.business_profile import (
    BusinessAccountInfo,
    BusinessAccountUpdate,
    BusinessProfileSummary,
    BusinessBillingOut,
    BusinessBillingHistoryOut,
    BusinessBillingPlan,
    BusinessInvoiceOut,
    BusinessPaymentMethod,
    BusinessPlanChange,
    BusinessSettingsOut,
    BusinessSettingsUpdate,
    BusinessUserCreate,
    BusinessUserOut,
    BusinessUserUpdate,
    ChangePasswordRequest,
)
from app.core.enums import UserRole
from app.core.security import verify_password
from app.crud.crud_user import create_user, get_by_email, update_user_password

router = APIRouter(prefix="/v1/business/profile", tags=["business-profile"])


def _build_account_info(db: Session, user: User, client: Client) -> BusinessAccountInfo:
    sub = get_active_subscription(db, client.id)
    plan_name = sub.plan.name if sub and sub.plan else None
    if not plan_name:
        role_plan_map = {
            UserRole.BUSINESS_ADMIN: "Business Plan",
            UserRole.ENTERPRISE_ADMIN: "Enterprise Plan",
            UserRole.SUPER_ADMIN: "Super Admin",
        }
        plan_name = role_plan_map.get(user.role)
    plan_id = sub.plan_id if sub else None

    total_users = db.query(User).filter(User.client_id == client.id).count()
    docs_processed = db.query(Document).filter(Document.client_id == client.id).count()

    month_start = datetime.now(timezone.utc) - timedelta(days=30)
    api_calls = (
        db.query(ApiLog)
        .filter(ApiLog.client_id == client.id, ApiLog.created_at >= month_start)
        .count()
    )

    return BusinessAccountInfo(
        name=user.username,
        email=user.email,
        company=client.company_name or client.name,
        phone=user.phone,
        address=client.address,
        website=user.website,
        planName=plan_name,
        planId=plan_id,
        totalUsers=total_users,
        docsProcessed=docs_processed,
        apiCalls=api_calls,
    )


def _normalize_role(role: str | None) -> UserRole:
    if not role:
        return UserRole.USER
    normalized = role.strip().lower()
    mapping = {
        "admin": UserRole.BUSINESS_ADMIN,
        "business_admin": UserRole.BUSINESS_ADMIN,
        "business admin": UserRole.BUSINESS_ADMIN,
        "member": UserRole.USER,
        "user": UserRole.USER,
    }
    if normalized not in mapping:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    return mapping[normalized]


def _user_to_out(user: User) -> BusinessUserOut:
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    normalized = role_value.strip().lower().replace(" ", "_")
    if normalized == "business_client_admin":
        normalized = "business_admin"
    return BusinessUserOut(
        id=user.id,
        name=user.username,
        email=user.email,
        role=normalized,
        status="active" if user.is_active else "inactive",
        joinedAt=user.created_at,
    )


def _format_money(value: int | None) -> float | None:
    if value is None:
        return None
    try:
        return value / 100
    except Exception:
        return None


def _build_billing_response(db: Session, current_user: User) -> BusinessBillingOut:
    sub = get_active_subscription(db, current_user.client_id)
    plan = sub.plan if sub else None
    plan_id = plan.id if plan else None

    documents_used = db.query(Document).filter(Document.client_id == current_user.client_id).count()
    month_start = datetime.now(timezone.utc) - timedelta(days=30)
    api_calls_used = (
        db.query(ApiLog)
        .filter(ApiLog.client_id == current_user.client_id, ApiLog.created_at >= month_start)
        .count()
    )

    next_billing_date = None
    if sub:
        anchor = sub.start_date or sub.created_at
        if anchor:
            next_billing_date = anchor + timedelta(days=30)

    available_plans = []
    for plan_item in list_active_plans(db):
        available_plans.append(
            BusinessBillingPlan(
                id=plan_item.id,
                name=plan_item.name,
                description=f"Up to {plan_item.max_users} users" if plan_item.max_users else None,
                price=_format_money(plan_item.monthly_price),
                currency="USD",
                interval="monthly",
                isCurrent=plan_id is not None and plan_item.id == plan_id,
            )
        )

    return BusinessBillingOut(
        planName=plan.name if plan else "No active plan",
        planId=plan_id,
        price=_format_money(plan.monthly_price) if plan else None,
        currency="USD" if plan else None,
        billingCycle="monthly" if plan else None,
        status=sub.status if sub else "inactive",
        documentsUsed=documents_used,
        documentsLimit=None,
        apiCallsUsed=api_calls_used,
        nextBillingDate=next_billing_date,
        paymentMethod=BusinessPaymentMethod(),
        availablePlans=available_plans,
    )


@router.get("", response_model=BusinessProfileSummary)
def read_profile_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Profile summary for dashboard header (name, email, plan)."""
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    sub = get_active_subscription(db, client.id)
    plan_name = sub.plan.name if sub and sub.plan else None
    if not plan_name:
        role_plan_map = {
            UserRole.BUSINESS_ADMIN: "Business Plan",
            UserRole.ENTERPRISE_ADMIN: "Enterprise Plan",
            UserRole.SUPER_ADMIN: "Super Admin",
        }
        plan_name = role_plan_map.get(current_user.role)
    display_name = (current_user.username or "").strip() or (current_user.email or "")
    return BusinessProfileSummary(
        name=display_name or current_user.email,
        fullName=display_name or current_user.email,
        email=current_user.email,
        plan=plan_name,
    )


@router.get("/account", response_model=BusinessAccountInfo)
def read_account_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")

    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    return _build_account_info(db, current_user, client)


@router.put("/account", response_model=BusinessAccountInfo)
def update_account_info(
    payload: BusinessAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")

    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    if payload.email and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        current_user.email = payload.email

    if payload.name is not None:
        current_user.username = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.website is not None:
        current_user.website = payload.website
    if payload.company is not None:
        client.company_name = payload.company
    if payload.address is not None:
        client.address = payload.address

    db.add(current_user)
    db.add(client)
    db.commit()
    db.refresh(current_user)
    db.refresh(client)

    return _build_account_info(db, current_user, client)


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Verify current password and set a new one. New password must be 8–72 characters."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )
    update_user_password(db, current_user, payload.new_password)


def _default_settings():
    return {
        "workspaceName": "",
        "timezone": "",
        "twoFactorEnabled": False,
        "sessionTimeout": None,
        "apiRateLimit": None,
        "webhookUrl": "",
        "emailNotifications": False,
        "activityAlerts": False,
        "billingAlerts": False,
        "securityAlerts": False,
    }


@router.get("/settings", response_model=BusinessSettingsOut)
def read_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    raw = client.settings or {}
    merged = {**_default_settings(), **raw}
    return BusinessSettingsOut(**merged)


@router.put("/settings", response_model=BusinessSettingsOut)
def update_settings(
    payload: BusinessSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    raw = dict(client.settings or _default_settings())
    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        raw[key] = value
    client.settings = raw
    db.add(client)
    db.commit()
    db.refresh(client)
    merged = {**_default_settings(), **client.settings}
    return BusinessSettingsOut(**merged)


@router.get("/billing", response_model=BusinessBillingOut)
def read_billing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    return _build_billing_response(db, current_user)


@router.get("/billing/invoices", response_model=list[BusinessInvoiceOut])
def list_billing_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    payments = list_payments_for_client(db, current_user.client_id)
    invoices = []
    for payment in payments:
        plan = payment.subscription.plan if payment.subscription else None
        amount = _format_money(plan.monthly_price) if plan else None
        invoices.append(
            BusinessInvoiceOut(
                id=payment.id,
                number=f"INV-{payment.id:05d}",
                date=payment.created_at,
                amount=amount,
                currency="USD" if amount is not None else None,
                status=payment.status,
                downloadUrl=None,
            )
        )
    return invoices


@router.get("/billing/history", response_model=list[BusinessBillingHistoryOut])
def list_billing_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if client.billing_history_cleared_at is not None:
        return []

    entries = []

    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.client_id == current_user.client_id)
        .order_by(Subscription.id.desc())
        .all()
    )

    for sub in subscriptions:
        plan = sub.plan
        plan_name = plan.name if plan else "Plan"
        amount = _format_money(plan.monthly_price) if plan else None
        start_date = sub.start_date or sub.created_at
        entries.append(
            BusinessBillingHistoryOut(
                id=f"sub_start_{sub.id}",
                type="plan_start",
                description=f"Subscribed to {plan_name}",
                date=start_date,
                amount=amount,
                currency="USD" if amount is not None else None,
                status=sub.status,
            )
        )
        if sub.end_date:
            entries.append(
                BusinessBillingHistoryOut(
                    id=f"sub_end_{sub.id}",
                    type="plan_end",
                    description=f"{plan_name} {sub.status}",
                    date=sub.end_date,
                    amount=None,
                    currency=None,
                    status=sub.status,
                )
            )

    payments = list_payments_for_client(db, current_user.client_id)
    for payment in payments:
        plan = payment.subscription.plan if payment.subscription else None
        plan_name = plan.name if plan else "Plan"
        amount = _format_money(plan.monthly_price) if plan else None
        entries.append(
            BusinessBillingHistoryOut(
                id=f"pay_{payment.id}",
                type="payment",
                description=f"Payment for {plan_name}",
                date=payment.created_at,
                amount=amount,
                currency="USD" if amount is not None else None,
                status=payment.status,
            )
        )

    entries.sort(
        key=lambda item: item.date or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return entries


@router.delete("/billing/history", status_code=204)
def clear_billing_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    delete_payments_for_client(db, current_user.client_id)
    client = db.query(Client).filter(Client.id == current_user.client_id).first()
    if client:
        client.billing_history_cleared_at = datetime.now(timezone.utc)
        db.add(client)
        db.commit()
    return None


@router.post("/billing/plan", response_model=BusinessBillingOut)
def change_billing_plan(
    payload: BusinessPlanChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    plan = get_plan(db, payload.planId)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")

    sub = change_subscription_plan(db, current_user.client_id, payload.planId)
    create_payment(db, client_id=current_user.client_id, subscription_id=sub.id, status="paid")
    return _build_billing_response(db, current_user)


@router.get("/users", response_model=list[BusinessUserOut])
def list_business_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    users = (
        db.query(User)
        .filter(User.client_id == current_user.client_id)
        .order_by(User.created_at.desc())
        .all()
    )
    return [_user_to_out(user) for user in users]


@router.post("/users", response_model=BusinessUserOut, status_code=201)
def add_business_user(
    payload: BusinessUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if get_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    role = _normalize_role(payload.role)
    password = payload.password or secrets.token_urlsafe(12)
    user = create_user(
        db,
        email=payload.email,
        password=password,
        username=payload.name,
        role=role,
        client_id=current_user.client_id,
    )

    return _user_to_out(user)


@router.patch("/users/{user_id}", response_model=BusinessUserOut)
def update_business_user(
    user_id: int,
    payload: BusinessUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.client_id == current_user.client_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.role is not None:
        user.role = _normalize_role(payload.role)

    if payload.status is not None:
        normalized = payload.status.strip().lower()
        if normalized not in {"active", "inactive"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        user.is_active = normalized == "active"

    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_to_out(user)


@router.delete("/users/{user_id}", status_code=204)
def delete_business_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself")

    user = (
        db.query(User)
        .filter(User.id == user_id, User.client_id == current_user.client_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
