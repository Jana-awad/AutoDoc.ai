"""
Synchronous document processing:
OCR -> optional text cleanup -> LLM extraction -> DB persistence
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.crud_platform_config import get_platform_config
from app.crud.crud_document import (
    delete_extractions_for_document,
    get_document,
    set_document_status,
)
from app.crud.crud_extraction import create_extraction
from app.services.extraction_context import get_extraction_context
from app.services.llm_extraction import (
    LOW_CONFIDENCE_THRESHOLD,
    calculate_confidence,
    detect_low_confidence_fields,
    extract_with_llm,
)
from app.services.ocr import get_text_and_structured_ocr_from_pdf
from app.services.text_cleanup import clean_ocr_text

logger = logging.getLogger(__name__)


def run_document_processing(db: Session, document_id: int) -> int:
    pc = get_platform_config(db)
    if not pc.document_processing_enabled:
        raise ValueError("Document processing is disabled platform-wide by operators.")
    doc = get_document(db, document_id)
    if not doc:
        raise ValueError(f"Document {document_id} not found")
    if doc.template_id is None:
        raise ValueError(f"Document {document_id} has no template_id")

    try:
        delete_extractions_for_document(db, doc.id)

        context = get_extraction_context(db, document_id)
        if not context:
            raise ValueError(f"No extraction context for document {document_id}")
        if not context["fields"]:
            raise ValueError(f"Template {doc.template_id} has no fields")

        logger.info("OCR start document_id=%s engine=google", document_id)
        ocr_result = get_text_and_structured_ocr_from_pdf(doc.file_url)
        ocr_text = (ocr_result.get("text") or "").strip()
        structured_pages = ocr_result.get("pages") or []
        line_count = ocr_text.count("\n") + 1 if ocr_text else 0
        logger.info(
            "OCR done document_id=%s text_length=%s lines=%s structured_pages=%s",
            document_id,
            len(ocr_text),
            line_count,
            len(structured_pages),
        )

        if not ocr_text.strip():
            logger.error(
                "OCR produced no text document_id=%s — check Google Vision credentials "
                "(GOOGLE_APPLICATION_CREDENTIALS or gcloud auth), API enablement, and billing. "
                "See requirements-google-vision.txt.",
                document_id,
            )

        cleaned = clean_ocr_text(ocr_text)
        extraction_result = extract_with_llm(cleaned, context, db=db)

        logger.info(
            "LLM extraction done document_id=%s keys=%s",
            document_id,
            list(extraction_result.keys()),
        )

        confidence_dict = calculate_confidence(extraction_result, context)
        low_confidence_fields = detect_low_confidence_fields(
            confidence_dict,
            threshold=LOW_CONFIDENCE_THRESHOLD,
        )
        if low_confidence_fields:
            logger.warning(
                "Low-confidence fields document_id=%s threshold=%s fields=%s",
                document_id,
                LOW_CONFIDENCE_THRESHOLD,
                low_confidence_fields,
            )

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

        set_document_status(db, doc, "done")
        return created

    except Exception:
        set_document_status(db, doc, "failed")
        raise
