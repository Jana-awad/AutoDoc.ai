"""user role enum underscores

Revision ID: f1a2b3c4d5e6
Revises: e3b9c2a4d1f7
Create Date: 2026-02-02 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e3b9c2a4d1f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE user_role RENAME VALUE 'super admin' TO 'super_admin';")
    op.execute("ALTER TYPE user_role RENAME VALUE 'business admin' TO 'business_admin';")
    op.execute("ALTER TYPE user_role RENAME VALUE 'enterprise admin' TO 'enterprise_admin';")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TYPE user_role RENAME VALUE 'super_admin' TO 'super admin';")
    op.execute("ALTER TYPE user_role RENAME VALUE 'business_admin' TO 'business admin';")
    op.execute("ALTER TYPE user_role RENAME VALUE 'enterprise_admin' TO 'enterprise admin';")
