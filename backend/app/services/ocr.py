"""
OCR utilities to extract text from PDFs using PyMuPDF.
If the PDF has embedded text, extract it directly; otherwise render pages to images and OCR.
"""
import os
from io import BytesIO
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

from app.core.config import settings


def _resolve_file_path(file_url: str) -> str:
    """Resolve relative file_url to absolute path."""
    if not file_url:
        raise ValueError("Document has no file_url")
    if os.path.isabs(file_url):
        abs_path = Path(file_url)
        if abs_path.exists():
            return str(abs_path)
        # Legacy absolute path pointing to backend/app/uploads
        backend_dir = Path(__file__).resolve().parent.parent.parent
        fallback = backend_dir / "uploads" / abs_path.name
        if fallback.exists():
            return str(fallback)
        return str(abs_path)
    # Assume file_url is relative to backend directory (e.g. uploads/xxx.pdf)
    backend_dir = Path(__file__).resolve().parent.parent.parent
    normalized = file_url.replace("\\", "/")
    candidate = backend_dir / normalized
    if candidate.exists():
        return str(candidate)
    # Legacy: some records stored as app/uploads/...
    if normalized.startswith("app/"):
        candidate = backend_dir / normalized.replace("app/", "", 1)
        if candidate.exists():
            return str(candidate)
    return str(backend_dir / normalized)


def get_text_from_pdf(file_url: str) -> str:
    """
    Extract text from a PDF. Uses embedded text when available; falls back to OCR.
    """
    file_path = _resolve_file_path(file_url)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")

    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    doc = fitz.open(file_path)
    texts: list[str] = []
    try:
        for page in doc:
            # 1) Try native text extraction
            text = page.get_text().strip()
            if text:
                texts.append(text)
                continue

            # 2) Fallback to OCR by rendering page to image
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            image = Image.open(BytesIO(img_bytes))
            ocr_text = pytesseract.image_to_string(image)
            texts.append(ocr_text)
    finally:
        doc.close()

    return "\n".join(texts).strip()
