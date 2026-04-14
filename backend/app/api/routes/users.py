from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_end_user
from app.core.security import verify_password
from app.crud.crud_user import update_user_password
from app.db.deps import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UserOut, UserProfileOut

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
