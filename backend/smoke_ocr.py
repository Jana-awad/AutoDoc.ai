"""Smoke-test the OCR pipeline used by the running backend.

Runs `get_text_and_structured_ocr_from_pdf()` against one PDF and one image so
we can confirm both the embedded-text path and the Google Vision path work.
"""
from __future__ import annotations

import os
import sys
import traceback
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from app.core.config import settings  # noqa: E402  loads .env via pydantic-settings
from app.services.ocr import get_text_and_structured_ocr_from_pdf  # noqa: E402


def banner(title: str) -> None:
    bar = "=" * 70
    print(f"\n{bar}\n{title}\n{bar}")


def show_result(label: str, file_url: str) -> None:
    banner(f"{label}: {file_url}")
    try:
        result = get_text_and_structured_ocr_from_pdf(file_url)
    except Exception as exc:
        print(f"!! OCR FAILED for {file_url}")
        traceback.print_exc()
        if "google" in repr(exc).lower() or "credentials" in repr(exc).lower():
            print(
                "\nHINT: Google Vision needs credentials. Set "
                "GOOGLE_APPLICATION_CREDENTIALS in backend/.env to a service "
                "account JSON, or run `gcloud auth application-default login`."
            )
        return

    text = result.get("text", "")
    pages = result.get("pages", [])
    sources = sorted({p.get("source") for p in pages if p.get("source")})
    n_lines = sum(len(p.get("lines") or []) for p in pages)

    print(f"  pages          : {len(pages)}")
    print(f"  page sources   : {sources or '(none)'}")
    print(f"  total lines    : {n_lines}")
    print(f"  total chars    : {len(text)}")
    preview = text[:600].replace("\r", "")
    print("  --- preview (first 600 chars) ---")
    print(preview if preview else "(empty)")


def main() -> None:
    backend_dir = Path(__file__).resolve().parent
    print(f"backend cwd          : {backend_dir}")
    print(f"PDF_OCR_DPI          : {getattr(settings, 'PDF_OCR_DPI', '<missing>')}")
    print(
        "PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR : "
        f"{getattr(settings, 'PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR', '<missing>')}"
    )
    gac = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or getattr(
        settings, "GOOGLE_APPLICATION_CREDENTIALS", None
    )
    qpid = getattr(settings, "GOOGLE_VISION_QUOTA_PROJECT_ID", None)
    print(f"GOOGLE_APPLICATION_CREDENTIALS : {gac or '(unset)'}")
    print(f"GOOGLE_VISION_QUOTA_PROJECT_ID : {qpid or '(unset)'}")

    candidates: list[tuple[str, str]] = []
    sample_pdf = backend_dir / "sample.pdf"
    if sample_pdf.exists():
        candidates.append(("PDF sample (embedded-text path likely)", "sample.pdf"))

    uploads = backend_dir / "uploads"
    image_pick = next(iter(sorted(uploads.glob("*.jpg"))), None) or next(
        iter(sorted(uploads.glob("*.png"))), None
    )
    if image_pick is not None:
        candidates.append(
            ("Image (forces Google Vision OCR)", f"uploads/{image_pick.name}")
        )

    if not candidates:
        print("!! No sample.pdf or uploads/*.{jpg,png} to test against.")
        sys.exit(1)

    for label, rel in candidates:
        show_result(label, rel)


if __name__ == "__main__":
    main()
