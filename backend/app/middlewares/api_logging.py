import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.db.session import SessionLocal
from app.core.jwt import decode_token

# paths you typically don’t want to log payloads for
SKIP_PATHS = {"/docs", "/openapi.json", "/redoc"}

MAX_BODY = 10_000  # limit to keep DB safe


class APILoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Always proceed first; we'll log after we get response
        request_body = None
        if path not in SKIP_PATHS and request.method in ("POST", "PUT", "PATCH"):
            try:
                body_bytes = await request.body()
                if body_bytes:
                    # keep only small bodies
                    body_bytes = body_bytes[:MAX_BODY]
                    request_body = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                request_body = None  # ignore invalid json / multipart

        # Extract client_id from JWT if present
        client_id = None
        token = None
        auth = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()

        if token:
            try:
                payload = decode_token(token)
                client_id = payload.get("client_id")  # only if you include it in token
            except Exception:
                client_id = None

        response: Response = await call_next(request)

        # Save log row
        if path not in SKIP_PATHS:
            db = SessionLocal()
            try:
                from app.crud.crud_api_log import create_api_log
                create_api_log(
                    db=db,
                    endpoint=f"{request.method} {path}",
                    status_code=response.status_code,
                    client_id=client_id,
                    request_payload=request_body,
                    response_payload=None,  # keep simple for now
                )
            finally:
                db.close()

        return response
