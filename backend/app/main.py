
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.api.router import api_router
from app.middlewares.api_logging import APILoggingMiddleware

app = FastAPI(title="AutoDoc AI")
app.add_middleware(APILoggingMiddleware)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="AutoDoc AI",
        version="1.0.0",
        description="AutoDoc AI API",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
def root():
    return {"status": "AutoDoc backend running"}

app.include_router(api_router)
