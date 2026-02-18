"""add user is_active

Revision ID: 20260218_user_active
Revises: 20260218_add_profile_fields
Create Date: 2026-02-18 16:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260218_user_active"
down_revision: Union[str, Sequence[str], None] = "20260218_add_profile_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.alter_column("users", "is_active", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "is_active")
