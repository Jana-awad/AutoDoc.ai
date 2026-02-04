from sqlalchemy.orm import Session
from app.models.api_log import ApiLog

def create_api_log(
    db: Session,
    endpoint: str,
    status_code: int | None = None,
    client_id: int | None = None,
    request_payload: dict | None = None,
    response_payload: dict | None = None,
):
    log = ApiLog(
        endpoint=endpoint,
        status_code=status_code,
        client_id=client_id,
        request_payload=request_payload,
        response_payload=response_payload,
    )
    db.add(log)
    db.commit()
