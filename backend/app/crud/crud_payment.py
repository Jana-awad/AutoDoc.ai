from sqlalchemy.orm import Session
from app.models.payment import Payment

def create_payment(db: Session, client_id: int, subscription_id: int, status: str = "paid") -> Payment:
    p = Payment(client_id=client_id, subscription_id=subscription_id, status=status)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def list_payments_for_client(db: Session, client_id: int) -> list[Payment]:
    return (
        db.query(Payment)
        .filter(Payment.client_id == client_id)
        .order_by(Payment.id.desc())
        .all()
    )
def get_payment(db: Session, payment_id: int) -> Payment | None:
    return db.query(Payment).filter(Payment.id == payment_id).first()
def delete_payment(db: Session, payment: Payment) -> None:
    db.delete(payment)
    db.commit()

def update_payment(db: Session, payment: Payment, status: str | None) -> Payment:
    if status is not None:
        payment.status = status
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
    
