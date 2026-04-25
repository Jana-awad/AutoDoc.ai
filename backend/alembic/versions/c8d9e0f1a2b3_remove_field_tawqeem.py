"""remove field توقيع صاحب العلاقة

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-04-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Matches logical name or human label used in the UI / API field_name.
FIELD_MARKER = "توقيع صاحب العلاقة"


def _has_label_column(conn) -> bool:
    return (
        conn.execute(
            sa.text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'fields'
                  AND column_name = 'label'
                LIMIT 1
                """
            )
        ).scalar()
        is not None
    )


def upgrade() -> None:
    conn = op.get_bind()
    has_label = _has_label_column(conn)

    field_where = "name = :m OR label = :m" if has_label else "name = :m"
    conn.execute(
        sa.text(
            "DELETE FROM extractions WHERE field_id IN "
            f"(SELECT id FROM fields WHERE {field_where})"
        ),
        {"m": FIELD_MARKER},
    )
    conn.execute(
        sa.text(f"DELETE FROM fields WHERE {field_where}"),
        {"m": FIELD_MARKER},
    )


def downgrade() -> None:
    # Row was removed intentionally; no safe restore without template_id and full definition.
    pass
