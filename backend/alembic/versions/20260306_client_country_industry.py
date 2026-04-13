"""add country and industry to clients

Revision ID: 20260306_country_industry
Revises: 20260219_settings
Create Date: 2026-03-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260306_country_industry"
down_revision: Union[str, Sequence[str], None] = "20260227_prompts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("country", sa.String(length=120), nullable=True))
    op.add_column("clients", sa.Column("industry", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("clients", "industry")
    op.drop_column("clients", "country")
