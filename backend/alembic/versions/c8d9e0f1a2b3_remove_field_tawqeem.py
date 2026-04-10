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


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM extractions WHERE field_id IN "
            "(SELECT id FROM fields WHERE name = :m OR label = :m)"
        ),
        {"m": FIELD_MARKER},
    )
    conn.execute(
        sa.text("DELETE FROM fields WHERE name = :m OR label = :m"),
        {"m": FIELD_MARKER},
    )


def downgrade() -> None:
    # Row was removed intentionally; no safe restore without template_id and full definition.
    pass
