"""
One-off pipeline runner for manual testing.

Creates a Document row pointing at a file already present under backend/uploads/
and runs the full sync pipeline (OCR -> cleanup -> LLM -> DB).

Writes a JSON summary to backend/scripts/pipeline_last_result.json so non-ASCII
content (Arabic, etc.) isn't mangled by the Windows console.

Usage (from backend/ with venv active):
    python scripts/run_pipeline_once.py --template-id 10 --file uploads/idtemp.pdf
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.client import Client
from app.models.document import Document
from app.models.extraction import Extraction
from app.models.field import Field
from app.models.template import Template
from app.services.document_pipeline import run_document_processing


def pick_client_id(db: Session) -> int:
    c = db.query(Client).order_by(Client.id.asc()).first()
    if not c:
        raise SystemExit("No Client rows in DB. Create at least one client first.")
    return c.id


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--template-id", type=int, required=True)
    p.add_argument("--file", type=str, required=True, help="Path relative to backend/ or absolute")
    p.add_argument("--client-id", type=int, default=None)
    p.add_argument(
        "--out",
        type=str,
        default="scripts/pipeline_last_result.json",
        help="Where to write the JSON result summary (relative to backend/)",
    )
    args = p.parse_args()

    db: Session = SessionLocal()
    doc_id: int | None = None
    try:
        template = db.get(Template, args.template_id)
        if not template:
            print(f"Template {args.template_id} not found", file=sys.stderr)
            return 2

        field_count = db.query(Field).filter(Field.template_id == template.id).count()

        client_id = args.client_id or pick_client_id(db)

        doc = Document(
            client_id=client_id,
            template_id=template.id,
            file_url=args.file,
            status="uploaded",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        doc_id = doc.id

        created = run_document_processing(db, doc.id)
        db.refresh(doc)

        extractions = (
            db.query(Extraction)
            .filter(Extraction.document_id == doc.id)
            .all()
        )
        field_map = {
            f.id: {
                "name": f.name,
                "field_type": f.field_type,
                "required": bool(f.required),
            }
            for f in db.query(Field).filter(Field.template_id == template.id).all()
        }

        result = {
            "status": "ok",
            "document_id": doc.id,
            "document_status": doc.status,
            "client_id": client_id,
            "template_id": template.id,
            "template_name": template.name,
            "template_field_count": field_count,
            "extractions_created": created,
            "extractions": [
                {
                    "field_id": e.field_id,
                    "field_name": field_map.get(e.field_id, {}).get("name"),
                    "field_type": field_map.get(e.field_id, {}).get("field_type"),
                    "required": field_map.get(e.field_id, {}).get("required"),
                    "value": e.value_text,
                    "confidence": float(e.confidence) if e.confidence is not None else None,
                }
                for e in extractions
            ],
        }
    except Exception as e:
        result = {
            "status": "error",
            "document_id": doc_id,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }
    finally:
        db.close()

    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = Path(__file__).resolve().parent.parent / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {out_path}")
    print(f"Status: {result.get('status')}  doc_id: {result.get('document_id')}")
    if result.get("status") == "error":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
