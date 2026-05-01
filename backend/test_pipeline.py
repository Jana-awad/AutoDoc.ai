"""End-to-end pipeline test:

1. Build a JWT for the super-admin already in the DB (skips the login UI).
2. Create a template via the Template Builder API.
3. Upload sample.pdf against that template.
4. Trigger /documents/{id}/process (OCR + LLM).
5. Print the JSON summary.
6. Clean up.
"""
import json
import os
import sys

import requests

from app.core.enums import UserRole
from app.core.jwt import create_access_token
from app.db.session import SessionLocal
from app.models.user import User

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = "http://127.0.0.1:8000"
PDF = "sample.pdf"


def main() -> None:
    if not os.path.exists(PDF):
        print(f"!! Missing {PDF}. Generate one first with the fitz one-liner.")
        return

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if admin is None:
            print("!! No super_admin user; aborting")
            return
        token = create_access_token(
            subject=str(admin.id), role=admin.role, client_id=admin.client_id
        )
        # Pick any existing client for the upload (super admin must supply one).
        from app.models.client import Client

        client = db.query(Client).first()
        if client is None:
            print("!! No clients in DB; create one before testing uploads")
            return
        client_id = client.id
        print(f"using super_admin id={admin.id} email={admin.email}")
        print(f"using client_id={client_id} ({client.name})")
    finally:
        db.close()

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a template that matches the sample.pdf content
    print("\n[1] POST /templates/builder")
    payload = {
        "template": {
            "template_key": "pipeline_test_invoice",
            "name": "Pipeline Test Invoice",
            "description": "End-to-end test template.",
            "document_type": "Invoice",
            "language": "en",
            "status": "active",
            "version": "1.0.0",
            "is_global": True,
        },
        "fields": [
            {
                "name": "invoice_number",
                "display_label": "Invoice number",
                "data_type": "string",
                "required": True,
                "extraction_hint": "Found near the top of the document.",
                "field_order": 0,
            },
            {
                "name": "date",
                "display_label": "Date",
                "data_type": "date",
                "required": True,
                "extraction_hint": "ISO date YYYY-MM-DD.",
                "field_order": 1,
            },
            {
                "name": "total",
                "display_label": "Total amount",
                "data_type": "number",
                "required": True,
                "extraction_hint": "Final amount, may include $ symbol.",
                "field_order": 2,
            },
        ],
        "ai_config": {
            "system_prompt": "You extract structured data from invoices and reply with valid JSON only.",
            "extraction_instructions": "Read the document and return invoice_number, date, total.",
            "output_format_rules": "Return only JSON. Use null for missing values.",
            "json_output_template": '{"invoice_number": "", "date": "", "total": ""}',
            "edge_case_handling_rules": "If a field is missing, return null.",
            "llm_model": "gpt-4o-mini",
            "llm_temperature": 0.0,
        },
    }
    r = requests.post(f"{BASE}/templates/builder", headers=headers, json=payload, timeout=15)
    r.raise_for_status()
    tpl = r.json()
    template_id = tpl["id"]
    print(f"    -> template id={template_id} key={tpl['template']['template_key']}")

    # 2. Upload sample.pdf with that template
    print("\n[2] POST /documents/upload")
    with open(PDF, "rb") as f:
        files = {"file": (PDF, f, "application/pdf")}
        data = {"template_id": str(template_id), "client_id": str(client_id)}
        r = requests.post(
            f"{BASE}/documents/upload", headers=headers, files=files, data=data, timeout=30
        )
    r.raise_for_status()
    doc = r.json()
    document_id = doc["id"]
    print(f"    -> document id={document_id} status={doc['status']}")

    # 3. Process (OCR + LLM)
    print("\n[3] POST /documents/{id}/process  (running OCR + OpenAI...)")
    r = requests.post(f"{BASE}/documents/{document_id}/process", headers=headers, timeout=120)
    if not r.ok:
        print("    !! process failed:", r.status_code, r.text)
        return
    proc = r.json()
    print(
        f"    -> status={proc['status']} extractions_created={proc['extractions_created']}"
    )

    # 4. Get the JSON summary
    print("\n[4] GET /documents/{id}/extractions/summary")
    r = requests.get(
        f"{BASE}/documents/{document_id}/extractions/summary", headers=headers, timeout=10
    )
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2, ensure_ascii=False))

    # 5. Cleanup
    print("\n[5] cleanup")
    requests.delete(f"{BASE}/documents/{document_id}", headers=headers, timeout=10)
    requests.delete(f"{BASE}/templates/{template_id}", headers=headers, timeout=10)
    print("    -> removed test document + template")


if __name__ == "__main__":
    main()
