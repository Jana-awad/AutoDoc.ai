"""placeholder: country / industry (revision was applied to DB; script was missing from repo)

Revision ID: 20260306_country_industry
Revises: a1b2c3d4e5f6
Create Date: 2026-03-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260306_country_industry"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Schema changes were already applied when this revision ran on the database.
    pass


def downgrade() -> None:
    pass
