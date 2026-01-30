from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import require_superadmin
from app.schemas.client import ClientCreate, ClientOut
from app.crud.crud_client import create_client, list_clients, get_client

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientOut)
def create(payload: ClientCreate, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    return create_client(db, name=payload.name, company_name=payload.company_name, email=payload.email)


@router.get("", response_model=list[ClientOut])
def read_all(db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    return list_clients(db)


@router.get("/{client_id}", response_model=ClientOut)
def read_one(client_id: int, db: Session = Depends(get_db), _super=Depends(require_superadmin)):
    client = get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
