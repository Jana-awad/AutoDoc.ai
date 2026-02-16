from pathlib import Path

import pytesseract
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

PDF_DIR = Path(__file__).parent / "uploads"


def ocr_pdf(path: Path) -> str:
    # Convert PDF pages to images, then OCR each page.
    pages = convert_from_path(str(path))
    texts: list[str] = []
    for i, page in enumerate(pages, start=1):
        text = pytesseract.image_to_string(page)
        texts.append(f"\n--- {path.name} | page {i} ---\n{text}")
    return "\n".join(texts)


def main() -> None:
    if not PDF_DIR.exists():
        raise SystemExit(f"PDF folder not found: {PDF_DIR}")

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDFs found in {PDF_DIR}")

    print(f"Tesseract version: {pytesseract.get_tesseract_version()}")
    for pdf in pdfs:
        print(ocr_pdf(pdf))


if __name__ == "__main__":
    main()
