"""template builder columns: human-readable id, language, status, AI config, field ordering, etc.

These columns make the ``templates`` and ``fields`` tables capable of storing
everything the Super Admin "Template Builder" UI captures:

- ``templates.template_key`` — human readable, unique identifier (e.g. ``invoice_v1``).
  Slug-style; used by integrations / API clients to reference a template
  without exposing the auto-incremented PK.
- ``templates.document_type / language / status / version`` — categorisation
  and lifecycle metadata.
- ``templates.created_by`` / ``updated_at`` — audit metadata.
- ``templates.extraction_instructions / output_format_rules / json_output_template
  / edge_case_handling_rules`` — AI prompt blocks (the existing
  ``system_prompt`` column from ``g9f8e7d6c5b4`` plus the rest of the AI
  config defined by the UI).
- ``templates.llm_model / llm_temperature / llm_max_tokens`` — per-template
  LLM runtime configuration. Falls back to global defaults when null.
- ``fields.example_value / field_order`` — UI-driven field metadata.

Revision ID: 20260430_template_builder
Revises: g9f8e7d6c5b4
Create Date: 2026-04-30
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260430_template_builder"
down_revision: Union[str, Sequence[str], None] = "g9f8e7d6c5b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_key VARCHAR(120)")
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_templates_template_key "
        "ON templates (template_key) WHERE template_key IS NOT NULL"
    )
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS document_type VARCHAR(120)")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en'")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '1.0.0'")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS created_by INTEGER")
    op.execute(
        "DO $$ BEGIN "
        "  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints "
        "                 WHERE constraint_name = 'fk_templates_created_by_users') THEN "
        "    ALTER TABLE templates ADD CONSTRAINT fk_templates_created_by_users "
        "      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; "
        "  END IF; "
        "END $$;"
    )
    op.execute(
        "ALTER TABLE templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE "
        "DEFAULT now()"
    )
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS extraction_instructions TEXT")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS output_format_rules TEXT")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS json_output_template TEXT")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS edge_case_handling_rules TEXT")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS llm_model VARCHAR(120)")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS llm_temperature NUMERIC(4,2)")
    op.execute("ALTER TABLE templates ADD COLUMN IF NOT EXISTS llm_max_tokens INTEGER")

    op.execute("ALTER TABLE fields ADD COLUMN IF NOT EXISTS example_value TEXT")
    op.execute("ALTER TABLE fields ADD COLUMN IF NOT EXISTS field_order INTEGER DEFAULT 0")


def downgrade() -> None:
    op.execute("ALTER TABLE fields DROP COLUMN IF EXISTS field_order")
    op.execute("ALTER TABLE fields DROP COLUMN IF EXISTS example_value")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS llm_max_tokens")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS llm_temperature")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS llm_model")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS edge_case_handling_rules")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS json_output_template")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS output_format_rules")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS extraction_instructions")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE templates DROP CONSTRAINT IF EXISTS fk_templates_created_by_users")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS created_by")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS version")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS language")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS document_type")
    op.execute("DROP INDEX IF EXISTS uq_templates_template_key")
    op.execute("ALTER TABLE templates DROP COLUMN IF EXISTS template_key")
