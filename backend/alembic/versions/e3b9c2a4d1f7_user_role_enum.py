"""user role enum

Revision ID: e3b9c2a4d1f7
Revises: d4c49f63235c
Create Date: 2026-02-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3b9c2a4d1f7"
down_revision: Union[str, Sequence[str], None] = "d4c49f63235c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE user_role AS ENUM ('user', 'super admin', 'business admin', 'enterprise admin');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    # Normalize all possible role formats to enum format (with spaces)
    op.execute("UPDATE users SET role = 'super admin' WHERE role = 'superadmin' OR role = 'super_admin';")
    op.execute("UPDATE users SET role = 'business admin' WHERE role = 'business_client_admin' OR role = 'business_admin';")
    op.execute("UPDATE users SET role = 'enterprise admin' WHERE role = 'enterprise_client_admin' OR role = 'enterprise_admin';")
    op.execute("UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';")


    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50);")

    op.execute("UPDATE users SET role = 'superadmin' WHERE role = 'super admin';")
    op.execute("UPDATE users SET role = 'business_client_admin' WHERE role = 'business admin';")
    op.execute("UPDATE users SET role = 'enterprise_client_admin' WHERE role = 'enterprise admin';")

    op.execute("DROP TYPE IF EXISTS user_role;")
