"""
E2E: signup (fresh user) -> upload Lebanese ID template PDF -> process -> list extractions.
Run from backend/ with API up: python scripts/e2e_upload_lebanese_pdf.py
"""
from __future__ import annotations

import io
import sys
import time
from pathlib import Path

import httpx

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

BASE = "http://127.0.0.1:8000"
LB_MARKER = "بطاقة هوية لبنانية"


def build_sample_id_pdf_bytes() -> bytes:
    """One-page PDF resembling printed ID lines (Arabic) for OCR + LLM."""
    from PIL import Image, ImageDraw, ImageFont
    import fitz

    # Windows Arabic-capable font
    font_paths = [
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\seguiemj.ttf"),
    ]
    font_path = next((p for p in font_paths if p.exists()), None)
    if font_path:
        font = ImageFont.truetype(str(font_path), 26)
    else:
        font = ImageFont.load_default()

    lines = [
        LB_MARKER,
        "الاسم: أحمد علي",
        "الشهرة: الخطيب",
        "اسم الأب: محمود",
        "اسم الأم وشهرتها: فاطمة الزهراء حسن",
        "محل الولادة: بيروت",
        "تاريخ الولادة: 15/03/1995",
        "الرقم: 123456789",
        "تاريخ الانتهاء: 01/01/2030",
        "الجنس: ذكر",
        "الجنسية: لبنانية",
        "رقم السجل: 98765",
    ]
    img = Image.new("RGB", (900, 700), color="white")
    draw = ImageDraw.Draw(img)
    y = 30
    for line in lines:
        draw.text((40, y), line, fill="black", font=font)
        y += 48

    png_buf = io.BytesIO()
    img.save(png_buf, format="PNG")
    png_buf.seek(0)

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    rect = fitz.Rect(36, 36, 559, 806)
    page.insert_image(rect, stream=png_buf.getvalue())
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def main() -> int:
    r = httpx.get(f"{BASE}/", timeout=10.0)
    r.raise_for_status()
    print("API root:", r.json())

    email = f"e2e_lb_{int(time.time())}@example.com"
    password = "E2Etestpw1!"

    payload = {
        "organization_name": "E2E Test Org",
        "company_name": "E2E Co",
        "full_name": "E2E Tester",
        "email": email,
        "password": password,
        "client_type": "business",
    }
    s = httpx.Client(base_url=BASE, timeout=300.0)
    resp = s.post("/auth/signup/business", json=payload)
    print("signup:", resp.status_code, resp.text[:500] if resp.text else "")
    resp.raise_for_status()

    resp = s.post("/auth/login", json={"email": email, "password": password})
    resp.raise_for_status()
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = s.get("/templates", headers=headers)
    resp.raise_for_status()
    templates = resp.json()
    lb_id = None
    for t in templates:
        if t.get("name") == LB_MARKER or LB_MARKER in (t.get("name") or ""):
            lb_id = t["id"]
            break
    if lb_id is None:
        print("ERROR: Lebanese global template not found in GET /templates")
        print("templates:", [(t["id"], t["name"]) for t in templates])
        return 1
    print("Lebanese template_id:", lb_id)

    pdf_bytes = build_sample_id_pdf_bytes()
    files = {"file": ("lebanese_id_sample.pdf", pdf_bytes, "application/pdf")}
    data = {"template_id": str(lb_id)}
    resp = s.post("/documents/upload", headers=headers, files=files, data=data)
    print("upload:", resp.status_code, resp.text[:800] if resp.text else "")
    resp.raise_for_status()
    doc = resp.json()
    doc_id = doc["id"]
    print("document_id:", doc_id, "status:", doc.get("status"), "file_url:", doc.get("file_url"))

    resp = s.post(f"/documents/{doc_id}/process", headers=headers)
    print("process:", resp.status_code, resp.text[:2000] if resp.text else "")
    if resp.status_code != 200:
        return 1
    body = resp.json()
    print("process summary: extractions_created=", body.get("extractions_created"), "doc_status=", body.get("document", {}).get("status"))

    resp = s.get(f"/extractions/document/{doc_id}", headers=headers)
    resp.raise_for_status()
    extractions = resp.json()
    print("extractions count:", len(extractions))
    for ex in extractions:
        name = ex.get("field_name") or ex.get("field_label")
        val = ex.get("value_text") or ex.get("value_json")
        conf = ex.get("confidence")
        print(f"  - {name!r}: {val!r} (confidence={conf})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
