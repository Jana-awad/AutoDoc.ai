from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.api.deps import get_current_user
from app.schemas.payment import PaymentOut, PaymentCreate, PaymentUpdate
from app.crud.crud_payment import (
    delete_payment,
    get_payment,
    list_payments_for_client,
    create_payment,
    update_payment,
)
from app.models.user import User
from app.core.enums import UserRole

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/me", response_model=list[PaymentOut])
def my_payments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != UserRole.SUPER_ADMIN and user.client_id is None:
        raise HTTPException(status_code=400, detail="User has no client")
    if user.client_id is None:
        raise HTTPException(status_code=400, detail="Superadmin has no client_id")
    return list_payments_for_client(db, user.client_id)
@router.get("/client/{client_id}", response_model=list[PaymentOut])
def payments_for_client(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only superadmin can view payments for other clients")
    return list_payments_for_client(db, client_id)

@router.get("/{payment_id}", response_model=PaymentOut)
def read_one(payment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if user.role != UserRole.SUPER_ADMIN and payment.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return payment

@router.post("", response_model=PaymentOut)
def create_route(payload: PaymentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != UserRole.SUPER_ADMIN and payload.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return create_payment(db, payload.client_id, payload.subscription_id, payload.status)

@router.put("/{payment_id}", response_model=PaymentOut)
def update_route(payment_id: int, payload: PaymentUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if user.role != UserRole.SUPER_ADMIN and payment.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return update_payment(db, payment, payload.status)
@router.delete("/{payment_id}")
def delete_payment_route(payment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if user.role != UserRole.SUPER_ADMIN and payment.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_payment(db, payment)
    return {"detail": "Payment deleted"}
@router.post("/{payment_id}/refund")
def refund_payment_route(payment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if user.role != UserRole.SUPER_ADMIN and payment.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_payment(db, payment)
    return {"detail": "Payment refunded"}
