import secrets
from sqlalchemy.orm import Session
from app.models.client import Client

def generate_api_key() -> str:
    return secrets.token_urlsafe(32)

def create_client(db: Session, name: str, company_name: str | None = None, email: str | None = None) -> Client:
    client = Client(
        name=name,
        company_name=company_name,
        email=email,
        api_key=generate_api_key(),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

def list_clients(db: Session) -> list[Client]:
    return db.query(Client).order_by(Client.id.desc()).all()

def get_client(db: Session, client_id: int) -> Client | None:
    return db.query(Client).filter(Client.id == client_id).first()

def get_client_by_api_key(db: Session, api_key: str) -> Client | None:
    return db.query(Client).filter(Client.api_key == api_key).first()
def delete_client(db: Session, client: Client) -> None:
    db.delete(client)
    db.commit()