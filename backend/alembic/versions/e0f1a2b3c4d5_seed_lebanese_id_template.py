"""seed global Lebanese ID template (بطاقة هوية لبنانية) and fields

Revision ID: e0f1a2b3c4d5
Revises: c8d9e0f1a2b3
Create Date: 2026-04-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LB_TEMPLATE_NAME = "بطاقة هوية لبنانية"


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
    existing = conn.execute(
        sa.text(
            "SELECT id FROM templates WHERE name = :name "
            "AND is_global IS TRUE AND client_id IS NULL LIMIT 1"
        ),
        {"name": LB_TEMPLATE_NAME},
    ).scalar()
    if existing is not None:
        return

    desc = "Template for Lebanese national ID card fields (Arabic)"
    row = conn.execute(
        sa.text(
            "INSERT INTO templates (client_id, name, description, is_global) "
            "VALUES (NULL, :name, :description, true) RETURNING id"
        ),
        {"name": LB_TEMPLATE_NAME, "description": desc},
    ).fetchone()
    template_id = row[0]

    has_label = _has_column(conn, "fields", "label")
    has_description = _has_column(conn, "fields", "description")

    # (name, label, field_type, required, description) — matches production DB shape
    fields: list[tuple[str, str, str, bool, str]] = [
        (
            "الاسم",
            "الاسم",
            "text",
            True,
            'Extract the value associated with the Arabic label "الاسم".\n'
            'The label may appear as "الاسم" or "الاسم:" and is located near the top right.\n'
            "Return the text immediately following this label on the same line.",
        ),
        (
            "الشهرة",
            "الشهرة",
            "text",
            True,
            'Extract the value associated with the Arabic label "الشهرة".\n'
            "It appears directly below the name field.\n"
            "Return the text following the label on the same line.",
        ),
        (
            "اسم الأب",
            "اسم الأب",
            "text",
            True,
            'Extract the value associated with the Arabic label "اسم الأب".\n'
            "Return the text immediately after this label.",
        ),
        (
            "اسم الأم وشهرتها",
            "اسم الأم وشهرتها",
            "text",
            True,
            'Extract the value associated with the Arabic label "اسم الأم وشهرتها".\n'
            "This field may contain multiple words (first name + family name).\n"
            "Return the full text after the label.",
        ),
        (
            "محل الولادة",
            "محل الولادة",
            "text",
            True,
            'Extract the value associated with the Arabic label "محل الولادة".\n'
            "Return the place name following the label.",
        ),
        (
            "تاريخ الولادة",
            "تاريخ الولادة",
            "date",
            True,
            'Extract the value associated with the Arabic label "تاريخ الولادة".\n'
            'The value is a date, usually numeric with separators like "/".\n'
            "Return the full date string.",
        ),
    ]

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

    for name, label, field_type, required, field_desc in fields:
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
            "AND is_global IS TRUE AND client_id IS NULL ORDER BY id DESC LIMIT 1"
        ),
        {"name": LB_TEMPLATE_NAME},
    ).fetchone()
    if row is None:
        return
    template_id = row[0]

    conn.execute(
        sa.text(
            "DELETE FROM extractions WHERE field_id IN "
            "(SELECT id FROM fields WHERE template_id = :tid)"
        ),
        {"tid": template_id},
    )
    conn.execute(
        sa.text("UPDATE documents SET template_id = NULL WHERE template_id = :tid"),
        {"tid": template_id},
    )
    conn.execute(sa.text("DELETE FROM fields WHERE template_id = :tid"), {"tid": template_id})
    conn.execute(sa.text("DELETE FROM templates WHERE id = :tid"), {"tid": template_id})
