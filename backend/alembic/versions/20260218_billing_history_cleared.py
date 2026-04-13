"""add billing_history_cleared_at to clients

Revision ID: 20260218_billing_cleared
Revises: 20260218_user_active
Create Date: 2026-02-18 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260218_billing_cleared"
down_revision: Union[str, Sequence[str], None] = "20260218_user_active"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clients",
        sa.Column("billing_history_cleared_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clients", "billing_history_cleared_at")
