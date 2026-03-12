"""add business profile fields

Revision ID: 20260218_add_profile_fields
Revises: f1a2b3c4d5e6
Create Date: 2026-02-18 15:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260218_add_profile_fields"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("website", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("address", sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("clients", "address")
    op.drop_column("users", "website")
    op.drop_column("users", "phone")
