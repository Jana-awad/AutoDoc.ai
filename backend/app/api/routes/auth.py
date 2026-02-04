from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.user import UserCreate, UserOut
from app.crud.crud_user import get_by_email, create_user, authenticate
from app.core.jwt import create_access_token
from app.api.deps import get_current_user
from app.models.user import User
from app.core.enums import UserRole


router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  
):
    # Email must be unique
    existing = get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Decide client_id safely
    if current_user.role == UserRole.SUPER_ADMIN:
        # superadmin CAN choose client_id
        if payload.client_id is None:
            raise HTTPException(status_code=400, detail="client_id is required")
        client_id = payload.client_id
    else:
        # non-superadmin CANNOT choose client_id
        if current_user.client_id is None:
            raise HTTPException(status_code=400, detail="User has no client")
        client_id = current_user.client_id

    # Create user (limits enforced inside create_user)
    user = create_user(
        db,
        email=payload.email,
        password=payload.password,
        username=payload.username,
        role=payload.role,
        client_id=client_id,
    )

    return user

@router.post("/login")
def login(payload: dict, db: Session = Depends(get_db)):
    # expects: {"email": "...", "password": "..."}
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")

    user = authenticate(db, email=email, password=password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
    subject=str(user.id),
    role=user.role,
    client_id=user.client_id,
)
    return {"access_token": token, "token_type": "bearer"}
