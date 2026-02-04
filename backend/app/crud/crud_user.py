from sqlalchemy.orm import Session
from app.models.user import User
from app.core.enums import UserRole
from app.core.security import hash_password, verify_password
from app.core.limits import ensure_client_can_add_user
from app.core.limits import ensure_client_can_add_user  

def get_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(
    db: Session,
    email: str,
    password: str,
    username: str | None = None,
    role: UserRole = UserRole.BUSINESS_ADMIN,
    client_id: int | None = None,
    enforce_limits: bool = True,
    commit: bool = True,
):
    # enforce user limit (only for client users)
    if client_id is not None and enforce_limits:
        ensure_client_can_add_user(db, client_id)

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(password),
        role=role,
        client_id=client_id,
    )
    db.add(user)
    if commit:
        db.commit()
        db.refresh(user)
    else:
        db.flush()
    return user

def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.id.desc()).all()
def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()

def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def update_user_password(db: Session, user: User, new_password: str) -> User:
    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def update_user_role(db: Session, user: User, new_role: str) -> User:
    user.role = new_role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
