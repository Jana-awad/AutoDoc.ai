from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.crud_document import (
    get_document,
    set_document_status,
    delete_extractions_for_document,
    create_mock_extractions,
)


@celery_app.task(name="process_document")
def process_document_task(document_id: int):
    """
    Celery task to process a document asynchronously.
    This will eventually call OCR + LLM extraction, but for now uses mock extractions.
    """
    db = SessionLocal()
    try:
        # Get document
        doc = get_document(db, document_id)
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        # Ensure status is processing
        if doc.status != "processing":
            set_document_status(db, doc, "processing")

        # Check template exists
        if doc.template_id is None:
            raise ValueError(f"Document {document_id} has no template_id")

        try:
            # Delete old extractions
            delete_extractions_for_document(db, doc.id)

            # TODO: Replace with real OCR + LLM extraction
            # For now, use mock extractions
            created = create_mock_extractions(db, doc.id, doc.template_id)

            # Mark as done
            set_document_status(db, doc, "done")
            return {"status": "success", "extractions_created": created}

        except Exception as e:
            # Mark as failed
            set_document_status(db, doc, "failed")
            raise

    finally:
        db.close()
