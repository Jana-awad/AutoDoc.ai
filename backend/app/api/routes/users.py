from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_end_user, require_superadmin
from app.core.security import verify_password
from app.crud.crud_user import update_user_password
from app.db.deps import get_db
from app.models.client import Client
from app.models.user import User
from app.core.enums import UserRole
from app.crud.crud_user import (
    list_users,
    get_user,
    delete_user,
    update_user_role,
    update_user_password,
    update_user,
)
from app.schemas.user import (
    ChangePasswordRequest,
    UserOut,
    UserPasswordUpdate,
    UserProfileOut,
    UserRoleUpdate,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])



@router.get("/me", response_model=UserProfileOut)
def me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company_name = None
    if current_user.client_id is not None:
        client = db.query(Client).filter(Client.id == current_user.client_id).first()
        if client:
            company_name = client.company_name or client.name
    base = UserOut.model_validate(current_user)
    return UserProfileOut(**{**base.model_dump(), "company_name": company_name})


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_end_user),
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


@router.get("", response_model=list[UserOut])
def list_all(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin)
):
    return list_users(db)


@router.get("/{user_id}", response_model=UserOut)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id == user_id:
        return current_user

    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")

    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user_route(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return update_user(db, user, payload.email, payload.username)


@router.put("/{user_id}/role", response_model=UserOut)
def update_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return update_user_role(db, user, payload.role)


@router.put("/{user_id}/password", response_model=UserOut)
def update_password(
    user_id: int,
    payload: UserPasswordUpdate,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return update_user_password(db, user, payload.password)


@router.delete("/{user_id}")
def delete_user_route(
    user_id: int,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_user(db, user)
    return {"detail": "User deleted"}
