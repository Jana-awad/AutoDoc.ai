from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user
from app.schemas.payment import PaymentOut
from app.crud.crud_payment import list_payments_for_client
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/me", response_model=list[PaymentOut])
def my_payments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "superadmin" and user.client_id is None:
        raise HTTPException(status_code=400, detail="User has no client")
    if user.client_id is None:
        raise HTTPException(status_code=400, detail="Superadmin has no client_id")
    return list_payments_for_client(db, user.client_id)
