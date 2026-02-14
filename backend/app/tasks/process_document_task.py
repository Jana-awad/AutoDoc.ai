from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.crud_document import (
    get_document,
    set_document_status,
    delete_extractions_for_document,
)
from app.crud.crud_extraction import create_extraction
from app.services.extraction_context import get_extraction_context
from app.services.llm_extraction import calculate_confidence, extract_with_llm
from app.services.ocr import get_text_from_pdf
from app.services.text_cleanup import clean_ocr_text


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

            # Step 1: OCR (PDF only)
            print(f"[process_document] OCR file_url={doc.file_url}")
            raw_text = get_text_from_pdf(doc.file_url)
            print(f"[process_document] OCR done length={len(raw_text)}")

            # Step 2: Cleanup
            cleaned_text = clean_ocr_text(raw_text)
            print(f"[process_document] cleanup done length={len(cleaned_text)}")

            # Step 3: Load template + fields
            context = get_extraction_context(db, document_id)
            if not context:
                raise ValueError(f"No extraction context for document {document_id}")
            print(f"[process_document] context fields={len(context['fields'])}")
            if len(context["fields"]) == 0:
                raise ValueError(f"Template {doc.template_id} has no fields")

            # Step 4: LLM extraction
            print("[process_document] calling LLM")
            extraction_result = extract_with_llm(cleaned_text, context)
            print(f"[process_document] LLM done keys={list(extraction_result.keys())}")

            # Step 5: Confidence per field
            confidence_dict = calculate_confidence(extraction_result, context)

            # Step 6: Save extractions
            created = 0
            for field in context["fields"]:
                field_id = field["id"]
                field_name = field["name"]
                value = extraction_result.get(field_name)
                confidence = confidence_dict.get(field_name, 0.5)
                value_text = None
                if value is not None:
                    value_text = str(value).strip() if isinstance(value, str) else str(value)
                create_extraction(
                    db=db,
                    document_id=doc.id,
                    field_id=field_id,
                    value_text=value_text,
                    value_json=value,
                    confidence=confidence,
                )
                created += 1
            print(f"[process_document] saved extractions count={created}")

            set_document_status(db, doc, "done")
            return {"status": "success", "extractions_created": created}

        except Exception as e:
            # Mark as failed
            set_document_status(db, doc, "failed")
            raise

    finally:
        db.close()
