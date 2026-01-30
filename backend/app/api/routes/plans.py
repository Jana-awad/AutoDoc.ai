from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user
from app.schemas.plan import PlanOut
from app.crud.crud_plan import list_active_plans
from app.models.user import User

router = APIRouter(prefix="/plans", tags=["plans"])

@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return list_active_plans(db)
