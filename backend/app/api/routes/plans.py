from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user, require_superadmin
from app.schemas.plan import PlanOut, PlanCreate, PlanUpdate
from app.crud.crud_plan import list_active_plans, list_plans as list_plans_crud, get_plan, create_plan, update_plan, delete_plan
from app.models.user import User

router = APIRouter(prefix="/plans", tags=["plans"])

@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return list_active_plans(db)

@router.get("/all", response_model=list[PlanOut])
def list_all(db: Session = Depends(get_db), _super: User = Depends(require_superadmin)):
    return list_plans_crud(db)

@router.get("/{plan_id}", response_model=PlanOut)
def read_one(plan_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    plan = get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.post("", response_model=PlanOut)
def create_route(payload: PlanCreate, db: Session = Depends(get_db), _super: User = Depends(require_superadmin)):
    return create_plan(
        db,
        payload.name,
        payload.monthly_price,
        payload.max_users,
        payload.allow_creation,
        payload.can_manage_templates,
        payload.is_active,
    )

@router.put("/{plan_id}", response_model=PlanOut)
def update_route(plan_id: int, payload: PlanUpdate, db: Session = Depends(get_db), _super: User = Depends(require_superadmin)):
    plan = get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return update_plan(
        db,
        plan,
        payload.name,
        payload.monthly_price,
        payload.max_users,
        payload.allow_creation,
        payload.can_manage_templates,
        payload.is_active,
    )

@router.delete("/{plan_id}")
def delete_route(plan_id: int, db: Session = Depends(get_db), _super: User = Depends(require_superadmin)):
    plan = get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    delete_plan(db, plan)
    return {"detail": "Plan deleted"}
