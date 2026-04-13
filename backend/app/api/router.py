from fastapi import APIRouter
from app.api.routes import auth, users, clients, fields, templates, documents, extractions
from app.api.routes import business_profile, business_dashboard, enterprise_profile, enterprise_dashboard
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
api_router.include_router(extractions.router)
api_router.include_router(business_profile.router)
api_router.include_router(business_dashboard.router)
api_router.include_router(enterprise_profile.router)
api_router.include_router(enterprise_dashboard.router)
