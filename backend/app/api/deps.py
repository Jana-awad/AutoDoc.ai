from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.jwt import decode_token
from app.models.user import User
from app.core.enums import UserRole
from app.crud.crud_subscription import get_active_subscription

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin only")
    return current_user


def require_template_management(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    # superadmin always allowed
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user

    # must be enterprise client admin
    if current_user.role != UserRole.ENTERPRISE_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to manage templates")

    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")

    sub = get_active_subscription(db, current_user.client_id)
    if not sub or not sub.plan or not sub.plan.can_manage_templates:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your plan does not allow template management",
        )

    return current_user


def _normalize_role_value(role: UserRole | str) -> str:
    raw = role.value if hasattr(role, "value") else str(role)
    normalized = raw.strip().lower().replace(" ", "_")
    if normalized == "business_client_admin":
        return "business_admin"
    return normalized


def require_business_admin(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
) -> User:
    role_value = _normalize_role_value(current_user.role)
    role_claim = None
    try:
        payload = decode_token(token)
        role_claim = _normalize_role_value(payload.get("role", ""))
    except Exception:
        role_claim = None

    allowed = {UserRole.BUSINESS_ADMIN.value, UserRole.SUPER_ADMIN.value}
    if role_value not in allowed and role_claim not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Business admin only")
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    return current_user


def require_end_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.USER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="End user role required")
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    return current_user


def require_enterprise_admin(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
) -> User:
    role_value = _normalize_role_value(current_user.role)
    role_claim = None
    try:
        payload = decode_token(token)
        role_claim = _normalize_role_value(payload.get("role", ""))
    except Exception:
        role_claim = None

    allowed = {UserRole.ENTERPRISE_ADMIN.value, UserRole.SUPER_ADMIN.value}
    if role_value not in allowed and role_claim not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enterprise admin only")
    if current_user.client_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no client")
    return current_user
