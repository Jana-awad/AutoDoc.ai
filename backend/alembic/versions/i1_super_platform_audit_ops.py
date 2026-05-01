"""Platform operator config + super audit logs.

Revision ID: i1_super_platform_audit
Revises: 20260430_template_builder
Create Date: 2026-05-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = "i1_super_platform_audit"
# Merge branches: template_builder head and Lebanese ID fields head both exist in repo history.
down_revision: Union[str, Sequence[str], None] = ("20260430_template_builder", "f0e1d2c3b4a5")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "platform_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_processing_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("uploads_paused", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("incident_title", sa.String(500), nullable=True),
        sa.Column("incident_body", sa.Text(), nullable=True),
        sa.Column("slo_target_percent", sa.Float(), nullable=True),
        sa.Column("default_rate_limit_per_minute", sa.Integer(), nullable=True),
        sa.Column("allowed_llm_models", JSONB(), nullable=True),
        sa.Column("blocked_prompt_substrings", JSONB(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_table(
        "super_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("entity_type", sa.String(80), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("payload", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_super_audit_logs_created_at", "super_audit_logs", ["created_at"])
    op.create_index("ix_super_audit_logs_user_id", "super_audit_logs", ["user_id"])
    op.execute(
        """
        INSERT INTO platform_config (id, document_processing_enabled, uploads_paused)
        SELECT 1, true, false
        WHERE NOT EXISTS (SELECT 1 FROM platform_config WHERE id = 1)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_super_audit_logs_user_id", table_name="super_audit_logs")
    op.drop_index("ix_super_audit_logs_created_at", table_name="super_audit_logs")
    op.drop_table("super_audit_logs")
    op.drop_table("platform_config")
