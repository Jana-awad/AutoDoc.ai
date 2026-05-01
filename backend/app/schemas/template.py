"""Pydantic schemas for the Template Builder pipeline.

Two API styles coexist on top of the same DB tables:

1. Lightweight ``Template`` CRUD (``TemplateCreate`` / ``TemplateUpdate`` /
   ``TemplateOut``) — kept for backward compatibility with the existing
   enterprise/business client UIs that just edit name+description.

2. Full builder payload (``TemplateBuilderPayload`` /
   ``TemplateBuilderOut``) — used by the Super Admin Template Builder. It
   carries every prompt block, every field, and every LLM tuning parameter
   in a single round trip so the UI is the single source of truth.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field as PydField


# ---------------------------------------------------------------------------
# Lightweight CRUD (legacy)
# ---------------------------------------------------------------------------


class TemplateBase(BaseModel):
    name: str
    description: str | None = None
    client_id: int | None = None
    is_global: bool = False


class TemplateCreate(TemplateBase):
    template_key: str | None = None
    document_type: str | None = None
    language: str | None = "en"
    status: str | None = "active"
    version: str | None = "1.0.0"


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_global: bool | None = None
    client_id: int | None = None
    template_key: str | None = None
    document_type: str | None = None
    language: str | None = None
    status: str | None = None
    version: str | None = None


class TemplateOut(BaseModel):
    """Compact representation used by lists. Includes lightweight
    counters/timestamps so the manager grid can render without a second call."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    template_key: str | None = None
    client_id: int | None = None
    is_global: bool = False
    name: str
    description: str | None = None
    document_type: str | None = None
    language: str | None = None
    status: str | None = None
    version: str | None = None
    fields_count: int = 0
    created_by: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ---------------------------------------------------------------------------
# Builder payload (used by the Super Admin Template Builder UI)
# ---------------------------------------------------------------------------


class FieldBuilderPayload(BaseModel):
    """One field as captured by the UI."""

    name: str = PydField(..., min_length=1, max_length=255)
    display_label: str | None = PydField(default=None, max_length=255)
    data_type: str = PydField(default="string", max_length=50)
    required: bool = False
    document_position: str | None = PydField(default=None, max_length=255)
    extraction_hint: str | None = None
    example_value: str | None = None
    validation_rules: str | None = PydField(default=None, max_length=255)
    field_order: int = 0


class FieldOutFull(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    name: str
    display_label: str | None = None
    data_type: str | None = None
    required: bool = False
    document_position: str | None = None
    extraction_hint: str | None = None
    example_value: str | None = None
    validation_rules: str | None = None
    field_order: int = 0


class AiConfigPayload(BaseModel):
    system_prompt: str | None = None
    extraction_instructions: str | None = None
    output_format_rules: str | None = None
    json_output_template: str | None = None
    edge_case_handling_rules: str | None = None
    llm_model: str | None = None
    llm_temperature: float | None = None
    llm_max_tokens: int | None = None


class TemplateBuilderTemplateBlock(BaseModel):
    """The "Template basic information" block from the UI."""

    template_key: str | None = PydField(default=None, max_length=120)
    name: str = PydField(..., min_length=1, max_length=255)
    description: str | None = None
    document_type: str | None = PydField(default=None, max_length=120)
    language: str = PydField(default="en", max_length=20)
    status: str = PydField(default="active", max_length=20)
    version: str = PydField(default="1.0.0", max_length=50)
    is_global: bool = True  # Super Admin defaults to global; can be overridden
    client_id: int | None = None


class TemplateBuilderPayload(BaseModel):
    """Single round-trip payload sent by the Template Builder form on save."""

    template: TemplateBuilderTemplateBlock
    fields: list[FieldBuilderPayload] = PydField(default_factory=list)
    ai_config: AiConfigPayload = PydField(default_factory=AiConfigPayload)


class TemplateBuilderOut(BaseModel):
    """Full template state as displayed in the builder. Lossless echo of what
    the user stored, plus generated metadata (id, timestamps, fields with their
    primary keys)."""

    model_config = ConfigDict(from_attributes=False)

    id: int
    template: TemplateBuilderTemplateBlock
    fields: list[FieldOutFull]
    ai_config: AiConfigPayload
    created_by: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ---------------------------------------------------------------------------
# Generate (test) endpoint
# ---------------------------------------------------------------------------


class TemplateGenerateRequest(BaseModel):
    """Payload for ``POST /templates/{id}/generate``.

    The caller may either send arbitrary ``document_text`` (e.g. paste OCR text
    of a sample document) or a map of ``variables`` that get substituted into
    the prompt body using ``{{ var_name }}`` placeholders. Both are optional;
    if neither is provided we still return a stub LLM response so the UI can
    smoke-test the prompt configuration."""

    document_text: str | None = None
    variables: dict[str, Any] | None = None


class TemplateGenerateResponse(BaseModel):
    template_id: int
    template_key: str | None
    model: str
    extraction: dict[str, Any]
    raw_response: str | None = None
