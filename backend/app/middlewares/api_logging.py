import json
import logging
import asyncio
import functools

import anyio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.db.session import SessionLocal
from app.core.jwt import decode_token

# paths you typically don't want to log payloads for
SKIP_PATHS = {"/docs", "/openapi.json", "/redoc"}

MAX_BODY = 10_000  # limit to keep DB safe

_log = logging.getLogger(__name__)

def _save_api_log_sync(*, endpoint: str, status_code: int, client_id: int | None, request_payload: dict | None):
    # Never allow logging to impact API response latency or availability.
    db = SessionLocal()
    try:
        from app.crud.crud_api_log import create_api_log

        create_api_log(
            db=db,
            endpoint=endpoint,
            status_code=status_code,
            client_id=client_id,
            request_payload=request_payload,
            response_payload=None,  # keep simple for now
        )
    except Exception:
        db.rollback()
        _log.warning("API request log not saved (database error)", exc_info=True)
    finally:
        db.close()


async def _save_api_log(*, endpoint: str, status_code: int, client_id: int | None, request_payload: dict | None):
    # anyio.to_thread.run_sync doesn't accept kwargs on some anyio versions.
    fn = functools.partial(
        _save_api_log_sync,
        endpoint=endpoint,
        status_code=status_code,
        client_id=client_id,
        request_payload=request_payload,
    )
    await anyio.to_thread.run_sync(fn)


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

        # Save log row in the background (never block the response).
        if path not in SKIP_PATHS:
            try:
                asyncio.create_task(
                    _save_api_log(
                        endpoint=f"{request.method} {path}",
                        status_code=response.status_code,
                        client_id=client_id,
                        request_payload=request_body,
                    )
                )
            except Exception:
                # If the event loop is shutting down, just skip logging.
                pass

        return response
