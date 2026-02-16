from fastapi import APIRouter
from app.api.routes import auth, users, clients, fields, templates,documents
from app.api.routes import plans, subscriptions, payments

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(clients.router)

api_router.include_router(fields.router)
api_router.include_router(templates.router)
api_router.include_router(documents.router)
api_router.include_router(plans.router)
api_router.include_router(subscriptions.router)
api_router.include_router(payments.router)
