"""Remove Lebanese ID fields not present on card: الجنس، تاريخ الانتهاء، رقم السجل

Revision ID: g9f8e7d6c5b4
Revises: f0e1d2c3b4a5
Create Date: 2026-04-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g9f8e7d6c5b4"
down_revision: Union[str, Sequence[str], None] = "f0e1d2c3b4a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LB_TEMPLATE_NAME = "بطاقة هوية لبنانية"

# Removed from template / LLM context (not on physical card layout used).
REMOVE_NAMES = ("الجنس", "تاريخ الانتهاء", "رقم السجل")

RESTORE_FIELDS: list[tuple[str, str, str, bool, str]] = [
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
        "رقم السجل",
        "رقم السجل",
        "text",
        False,
        'Extract the registry / record number for "رقم السجل" if present on the card.',
    ),
]


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

    for name in REMOVE_NAMES:
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

    insert_field = sa.text(
        "INSERT INTO fields (template_id, name, label, field_type, required, description) "
        "VALUES (:template_id, :name, :label, :field_type, :required, :description)"
    )
    for name, label, field_type, required, field_desc in RESTORE_FIELDS:
        exists = conn.execute(
            sa.text(
                "SELECT 1 FROM fields WHERE template_id = :tid AND name = :name LIMIT 1"
            ),
            {"tid": template_id, "name": name},
        ).scalar()
        if exists:
            continue
        conn.execute(
            insert_field,
            {
                "template_id": template_id,
                "name": name,
                "label": label,
                "field_type": field_type,
                "required": required,
                "description": field_desc,
            },
        )
