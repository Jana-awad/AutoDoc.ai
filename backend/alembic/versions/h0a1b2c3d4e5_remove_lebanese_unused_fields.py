"""Remove Lebanese ID fields not present on card: الجنس، تاريخ الانتهاء، رقم السجل

Revision ID: h0a1b2c3d4e5
Revises: f0e1d2c3b4a5
Create Date: 2026-04-13

NOTE: this migration originally shipped with revision id ``g9f8e7d6c5b4`` which
collided with another migration (``g9f8e7d6c5b4_template_prompt_columns``).
Alembic refuses to build a script directory when two scripts share the same
revision id, so this file was renamed to ``h0a1b2c3d4e5`` and the merge
migration ``i1_super_platform_audit`` was updated to chain through this new id
instead of its parent ``f0e1d2c3b4a5``.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h0a1b2c3d4e5"
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
