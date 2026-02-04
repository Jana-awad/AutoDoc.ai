from pydantic import BaseModel

class ClientBase(BaseModel):
    name: str
    company_name: str | None = None
    email: str | None = None

class ClientCreate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    api_key: str | None = None

    class Config:
        from_attributes = True
