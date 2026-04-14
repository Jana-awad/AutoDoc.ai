"""Upload a PDF from disk, process with Lebanese template, print extractions."""
from __future__ import annotations

import sys
import time
from pathlib import Path

import httpx

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

BASE = "http://127.0.0.1:8000"
LB_NAME = "بطاقة هوية لبنانية"


def main() -> int:
    pdf_path = Path(sys.argv[1]).resolve()
    if not pdf_path.is_file():
        print("File not found:", pdf_path)
        return 1

    email = f"e2e_file_{int(time.time())}@example.com"
    password = "E2Etestpw1!"

    s = httpx.Client(base_url=BASE, timeout=300.0)
    s.get("/").raise_for_status()

    s.post(
        "/auth/signup/business",
        json={
            "organization_name": "E2E File Test",
            "company_name": "E2E",
            "full_name": "Tester",
            "email": email,
            "password": password,
            "client_type": "business",
        },
    ).raise_for_status()

    token = s.post("/auth/login", json={"email": email, "password": password}).json()[
        "access_token"
    ]
    headers = {"Authorization": f"Bearer {token}"}

    templates = s.get("/templates", headers=headers).json()
    lb_id = next((t["id"] for t in templates if t.get("name") == LB_NAME), None)
    if lb_id is None:
        print("Lebanese template not found")
        return 1

    with open(pdf_path, "rb") as f:
        files = {"file": (pdf_path.name, f, "application/pdf")}
        data = {"template_id": str(lb_id)}
        r = s.post("/documents/upload", headers=headers, files=files, data=data)
    r.raise_for_status()
    doc = r.json()
    doc_id = doc["id"]
    print("uploaded document_id:", doc_id, "saved as:", doc.get("file_url"))

    r = s.post(f"/documents/{doc_id}/process", headers=headers)
    print("process status:", r.status_code)
    if r.status_code != 200:
        print(r.text)
        return 1
    print("extractions_created:", r.json().get("extractions_created"))

    ex = s.get(f"/documents/{doc_id}/extractions/summary", headers=headers).json()
    print("--- summary ---")
    for k, v in sorted(ex.items(), key=lambda x: str(x[0])):
        print(f"  {k}: {v}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
