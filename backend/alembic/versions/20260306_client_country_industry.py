"""merge branches and add country/industry on clients

This is a MERGE migration: the repo had two divergent heads
(``a1b2c3d4e5f6`` for field description / label and ``20260227_prompts`` for prompt
features). They are joined here so all later revisions can build on a single
linear chain.

Revision ID: 20260306_country_industry
Revises: 20260227_prompts, a1b2c3d4e5f6
Create Date: 2026-03-06
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260306_country_industry"
down_revision: Union[str, Sequence[str], None] = ("20260227_prompts", "a1b2c3d4e5f6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Idempotent: in production the columns are already there. Use IF NOT EXISTS
    # so this also works on a fresh DB created from this chain.
    op.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(120)")
    op.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry VARCHAR(120)")


def downgrade() -> None:
    op.execute("ALTER TABLE clients DROP COLUMN IF EXISTS industry")
    op.execute("ALTER TABLE clients DROP COLUMN IF EXISTS country")
