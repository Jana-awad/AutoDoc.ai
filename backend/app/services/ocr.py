"""
Extract text from PDFs and common images (embedded text or rendered-page OCR).

Uploads may be ``.pdf`` or raster images (``png``, ``jpeg``, ``webp``, etc.). Images that
PyMuPDF cannot open directly are converted to a one-page PDF via Pillow, then processed
like a normal PDF.

OCR uses **Google Cloud Vision** ``document_text_detection`` only.
Install: ``pip install -r requirements-google-vision.txt``
Auth: set ``GOOGLE_APPLICATION_CREDENTIALS`` to a service account JSON, or use
``gcloud auth application-default login`` for local dev.

Returns a single shape for the document pipeline: {"text": str, "pages": [...]}.
"""
from __future__ import annotations

import logging
import os
import tempfile
from io import BytesIO
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

_vision_client: Any = None


def _resolve_file_path(file_url: str) -> str:
    if not file_url:
        raise ValueError("Document has no file_url")
    if os.path.isabs(file_url):
        abs_path = Path(file_url)
        if abs_path.exists():
            return str(abs_path)
        backend_dir = Path(__file__).resolve().parent.parent.parent
        fallback = backend_dir / "uploads" / abs_path.name
        if fallback.exists():
            return str(fallback)
        return str(abs_path)
    backend_dir = Path(__file__).resolve().parent.parent.parent
    normalized = file_url.replace("\\", "/")
    candidate = backend_dir / normalized
    if candidate.exists():
        return str(candidate)
    if normalized.startswith("app/"):
        candidate = backend_dir / normalized.replace("app/", "", 1)
        if candidate.exists():
            return str(candidate)
    return str(backend_dir / normalized)


def _embedded_text_sufficient(text: str) -> bool:
    min_chars = int(getattr(settings, "PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR", 40) or 0)
    if min_chars <= 0:
        return False
    return len((text or "").strip()) >= min_chars


def _get_vision_client():
    global _vision_client
    if _vision_client is None:
        try:
            from google.api_core.client_options import ClientOptions
            from google.cloud import vision
        except ImportError as e:
            raise RuntimeError(
                "Google Cloud Vision is not installed. pip install -r requirements-google-vision.txt"
            ) from e
        q = getattr(settings, "GOOGLE_VISION_QUOTA_PROJECT_ID", None)
        q = str(q).strip() if q else ""
        if q:
            opts = ClientOptions(quota_project_id=q)
            _vision_client = vision.ImageAnnotatorClient(client_options=opts)
        else:
            _vision_client = vision.ImageAnnotatorClient()
    return _vision_client


def _google_annotation_to_lines(ann: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not ann or not getattr(ann, "pages", None):
        return out
    for page in ann.pages:
        for block in page.blocks:
            for para in block.paragraphs:
                word_parts: list[str] = []
                confs: list[float] = []
                for word in para.words:
                    wtxt = "".join((s.text or "") for s in word.symbols)
                    word_parts.append(wtxt)
                    wc = getattr(word, "confidence", None)
                    if wc is not None:
                        try:
                            c = float(wc)
                            if c > 0:
                                confs.append(c)
                        except (TypeError, ValueError):
                            pass
                merged = "".join(word_parts).strip()
                if not merged:
                    continue
                avg = sum(confs) / len(confs) if confs else None
                out.append({"text": merged, "confidence": avg})
    return out


def _ocr_image_google(image: Image.Image) -> tuple[str, list[dict[str, Any]]]:
    try:
        from google.cloud import vision
    except ImportError as e:
        raise RuntimeError(
            "Google Cloud Vision is not installed. pip install -r requirements-google-vision.txt"
        ) from e

    client = _get_vision_client()
    buf = BytesIO()
    image.save(buf, format="PNG")
    img = vision.Image(content=buf.getvalue())
    response = client.document_text_detection(image=img)
    err = getattr(response, "error", None)
    err_msg = getattr(err, "message", None) if err else None
    if err_msg:
        raise RuntimeError(f"Google Vision API error: {err_msg}")

    ann = response.full_text_annotation
    if not ann or not (ann.text or "").strip():
        return "", []

    text = ann.text.strip()
    structured = _google_annotation_to_lines(ann)
    if not structured:
        structured = [
            {"text": ln.strip(), "confidence": None}
            for ln in text.splitlines()
            if ln.strip()
        ]
        if not structured:
            structured = [{"text": text, "confidence": None}]
    return text, structured


# Phone photos and scans can exceed 4000px; OCR at full res risks OOM/timeouts.
_OCR_MAX_IMAGE_EDGE = int(os.environ.get("AUTODOC_OCR_MAX_IMAGE_EDGE", "2400"))


def _downscale_pil_for_ocr(im: Image.Image, max_edge: int | None = None) -> Image.Image:
    limit = max_edge if max_edge is not None else _OCR_MAX_IMAGE_EDGE
    if limit <= 0:
        return im
    w, h = im.size
    m = max(w, h)
    if m <= limit:
        return im
    scale = limit / float(m)
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    try:
        resample = Image.Resampling.LANCZOS
    except AttributeError:
        resample = Image.LANCZOS  # type: ignore[attr-defined]
    logger.info("OCR downscale %sx%s -> %sx%s (max_edge=%s)", w, h, nw, nh, limit)
    return im.resize((nw, nh), resample)


def _pil_to_rgb(im: Image.Image) -> Image.Image:
    """Flatten transparency / palette images to RGB for embedding in PDF."""
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    if im.mode == "P":
        im = im.convert("RGBA")
        return _pil_to_rgb(im)
    if im.mode != "RGB":
        return im.convert("RGB")
    return im


def _image_file_to_temp_pdf(file_path: str) -> str:
    """
    Build a single-page PDF from a raster image file (WEBP, HEIC with plugins, etc.).
    Caller must delete the returned path when finished.
    """
    try:
        img = Image.open(file_path)
        img.load()
    except UnidentifiedImageError as e:
        raise ValueError(
            f"File is not a supported image or PDF: {file_path}. "
            "Use PDF, PNG, JPEG, or install extra codecs (e.g. pillow-heif for HEIC)."
        ) from e

    img = _downscale_pil_for_ocr(_pil_to_rgb(img))
    w, h = img.size
    buf = BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    pdf_doc = fitz.open()
    try:
        page = pdf_doc.new_page(width=float(w), height=float(h))
        page.insert_image(page.rect, stream=png_bytes)
        fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="autodoc_img_")
        os.close(fd)
        pdf_doc.save(tmp_path)
    finally:
        pdf_doc.close()
    return tmp_path


def _open_document_for_ocr(file_path: str) -> tuple[fitz.Document, str | None]:
    """
    Open a path as a PyMuPDF document. Returns (document, temp_pdf_path_or_none).

    - ``.pdf`` is opened as PDF only (no image fallback if corrupt).
    - Other paths: try PyMuPDF (works for many PNG/JPEG on disk); if that fails, PIL → temp PDF.
    """
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return fitz.open(file_path), None

    try:
        doc = fitz.open(file_path)
        if doc.page_count > 0:
            return doc, None
        doc.close()
    except Exception:
        pass

    tmp = _image_file_to_temp_pdf(file_path)
    return fitz.open(tmp), tmp


def get_text_and_structured_ocr_from_pdf(file_url: str) -> dict[str, Any]:
    """
    Extract text from a PDF or image-backed document. Uses embedded text when long enough;
    otherwise Google Vision OCR per page.

    Returns:
        {"text": full document text, "pages": [ {"page_index": int, "lines": [...] }, ... ]}
    """
    file_path = _resolve_file_path(file_url)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Document not found: {file_path}")

    dpi = int(getattr(settings, "PDF_OCR_DPI", 300) or 300)
    temp_pdf: str | None = None
    doc: fitz.Document | None = None
    page_texts: list[str] = []
    pages_out: list[dict[str, Any]] = []
    try:
        doc, temp_pdf = _open_document_for_ocr(file_path)
        for i, page in enumerate(doc):
            embedded = (page.get_text() or "").strip()
            if embedded and _embedded_text_sufficient(embedded):
                page_texts.append(embedded)
                pages_out.append(
                    {
                        "page_index": i + 1,
                        "source": "embedded",
                        "lines": [{"text": ln.strip(), "confidence": None} for ln in embedded.splitlines() if ln.strip()],
                    }
                )
                continue

            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            image = _downscale_pil_for_ocr(Image.open(BytesIO(img_bytes)))
            ocr_plain, lines = _ocr_image_google(image)
            page_texts.append(ocr_plain)
            pages_out.append(
                {"page_index": i + 1, "source": "google", "lines": lines}
            )
    finally:
        if doc is not None:
            doc.close()
        if temp_pdf and os.path.isfile(temp_pdf):
            try:
                os.unlink(temp_pdf)
            except OSError:
                logger.warning("Could not remove temp PDF %s", temp_pdf)

    full_text = "\n".join(t for t in page_texts if t).strip()
    return {"text": full_text, "pages": pages_out}
