"""Add more Lebanese ID fields for OCR/LLM (رقم، انتهاء، جنس، جنسية، سجل)

Revision ID: f0e1d2c3b4a5
Revises: e0f1a2b3c4d5
Create Date: 2026-04-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0e1d2c3b4a5"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LB_TEMPLATE_NAME = "بطاقة هوية لبنانية"

# Extra fields often printed on Lebanese national ID (Arabic labels).
NEW_FIELDS: list[tuple[str, str, str, bool, str]] = [
    (
        "الرقم",
        "الرقم",
        "text",
        False,
        'Extract the national ID number shown next to the label "الرقم" or "رقم الهوية".\n'
        "Return digits only if the card shows a clean numeric ID; otherwise return the full string as printed.",
    ),
    (
        "تاريخ الانتهاء",
        "تاريخ الانتهاء",
        "date",
        False,
        'Extract the expiry date associated with "تاريخ الانتهاء" or similar wording.\n'
        "Return the date as printed (e.g. with / or - separators).",
    ),
    (
        "الجنس",
        "الجنس",
        "text",
        False,
        'Extract the gender value for label "الجنس" (e.g. ذكر، أنثى, M, F).',
    ),
    (
        "الجنسية",
        "الجنسية",
        "text",
        False,
        'Extract nationality text for label "الجنسية" (e.g. لبنانية).',
    ),
    (
        "رقم السجل",
        "رقم السجل",
        "text",
        False,
        'Extract the registry / record number for "رقم السجل" if present on the card.',
    ),
]


def _has_column(conn, table_name: str, column_name: str) -> bool:
    return (
        conn.execute(
            sa.text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = :table_name
                  AND column_name = :column_name
                LIMIT 1
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        ).scalar()
        is not None
    )


def upgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text(
            "SELECT id FROM templates WHERE name = :name "
            "AND is_global IS TRUE AND client_id IS NULL LIMIT 1"
        ),
        {"name": LB_TEMPLATE_NAME},
    ).fetchone()
    if row is None:
        return
    template_id = row[0]

    has_label = _has_column(conn, "fields", "label")
    has_description = _has_column(conn, "fields", "description")

    if has_label and has_description:
        insert_field = sa.text(
            "INSERT INTO fields (template_id, name, label, field_type, required, description) "
            "VALUES (:template_id, :name, :label, :field_type, :required, :description)"
        )
    elif has_label and not has_description:
        insert_field = sa.text(
            "INSERT INTO fields (template_id, name, label, field_type, required) "
            "VALUES (:template_id, :name, :label, :field_type, :required)"
        )
    elif (not has_label) and has_description:
        insert_field = sa.text(
            "INSERT INTO fields (template_id, name, field_type, required, description) "
            "VALUES (:template_id, :name, :field_type, :required, :description)"
        )
    else:
        insert_field = sa.text(
            "INSERT INTO fields (template_id, name, field_type, required) "
            "VALUES (:template_id, :name, :field_type, :required)"
        )

    for name, label, field_type, required, field_desc in NEW_FIELDS:
        exists = conn.execute(
            sa.text(
                "SELECT 1 FROM fields WHERE template_id = :tid AND name = :name LIMIT 1"
            ),
            {"tid": template_id, "name": name},
        ).scalar()
        if exists:
            continue
        params = {
            "template_id": template_id,
            "name": name,
            "field_type": field_type,
            "required": required,
        }
        if has_label:
            params["label"] = label
        if has_description:
            params["description"] = field_desc

        conn.execute(insert_field, params)


def downgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text(
            "SELECT id FROM templates WHERE name = :name "
            "AND is_global IS TRUE AND client_id IS NULL LIMIT 1"
        ),
        {"name": LB_TEMPLATE_NAME},
    ).fetchone()
    if row is None:
        return
    template_id = row[0]
    names = [f[0] for f in NEW_FIELDS]

    for name in names:
        fid = conn.execute(
            sa.text(
                "SELECT id FROM fields WHERE template_id = :tid AND name = :name LIMIT 1"
            ),
            {"tid": template_id, "name": name},
        ).scalar()
        if fid is None:
            continue
        conn.execute(
            sa.text("DELETE FROM extractions WHERE field_id = :fid"), {"fid": fid}
        )
        conn.execute(sa.text("DELETE FROM fields WHERE id = :fid"), {"fid": fid})
