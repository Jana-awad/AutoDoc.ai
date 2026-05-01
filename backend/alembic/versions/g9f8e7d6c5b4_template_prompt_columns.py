"""template + field prompt columns (system_prompt, extraction_prompt, ...)

The columns were applied directly to production DBs by an earlier ad-hoc
migration whose script was missing from the repo. This file restores the chain
so ``alembic upgrade head`` works on fresh and existing databases.

Revision ID: g9f8e7d6c5b4
Revises: e0f1a2b3c4d5
Create Date: 2026-04-25
"""
from typing import Sequence, Union

from alembic import op


revision: str = "g9f8e7d6c5b4"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS system_prompt TEXT")
    op.execute("ALTER TABLE fields ADD COLUMN IF NOT EXISTS extraction_prompt TEXT")
    op.execute("ALTER TABLE fields ADD COLUMN IF NOT EXISTS positioning_hint TEXT")
    op.execute("ALTER TABLE fields ADD COLUMN IF NOT EXISTS format_hint VARCHAR(255)")


def downgrade() -> None:
    op.execute("ALTER TABLE fields DROP COLUMN IF EXISTS format_hint")
    op.execute("ALTER TABLE fields DROP COLUMN IF EXISTS positioning_hint")
    op.execute("ALTER TABLE fields DROP COLUMN IF EXISTS extraction_prompt")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS system_prompt")
