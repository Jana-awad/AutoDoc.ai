
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.api.router import api_router
from app.middlewares.api_logging import APILoggingMiddleware

app = FastAPI(title="AutoDoc AI")
app.add_middleware(APILoggingMiddleware)
# Same-origin behind the deploy/ reverse proxy (Caddy/nginx) means CORS is
# bypassed entirely. The lists below only matter when the SPA is loaded from
# a different origin: the Vite dev server (:5173/:5174), the local HTTPS
# proxy on :443, or LAN phone demos. Add new prod origins here only if you
# choose to host the API on a different domain than the SPA.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8000",
    
    # Dev: `npx serve` may pick another port if 5173 is busy; allow phone on LAN for the mobile demo.
        "https://localhost",
        "https://127.0.0.1",
        "https://localhost:5173",
        "https://127.0.0.1:5173",
    ],
    # Dev convenience: any localhost/127.0.0.1 port and LAN /16 (phone demos),
    # over either http or https so the deploy/Caddyfile.local proxy works too.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$|https?://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
