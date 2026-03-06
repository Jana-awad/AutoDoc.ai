"""stub for prompts revision (already applied in DB)

Revision ID: 20260227_prompts
Revises: 20260219_settings
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_prompts"
down_revision: Union[str, Sequence[str], None] = "20260219_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
