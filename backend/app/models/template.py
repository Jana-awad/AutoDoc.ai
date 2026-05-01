# backend/app/models/template.py
"""ORM model for an extraction template (the unit edited by the Super Admin
"Template Builder" UI). Mirrors every column managed by alembic migration
``20260430_template_builder``."""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    is_global = Column(Boolean, default=False, nullable=False)

    template_key = Column(String(120), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    document_type = Column(String(120), nullable=True)
    language = Column(String(20), nullable=True, default="en")
    status = Column(String(20), nullable=True, default="active")
    version = Column(String(50), nullable=True, default="1.0.0")

    # Auditing
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # AI prompt configuration. Free-form text blocks combined when the LLM is
    # invoked (see app.services.llm_extraction._build_messages).
    system_prompt = Column(Text, nullable=True)
    extraction_instructions = Column(Text, nullable=True)
    output_format_rules = Column(Text, nullable=True)
    json_output_template = Column(Text, nullable=True)
    edge_case_handling_rules = Column(Text, nullable=True)

    # LLM runtime config (per-template overrides; null => use global defaults).
    llm_model = Column(String(120), nullable=True)
    llm_temperature = Column(Numeric(4, 2), nullable=True)
    llm_max_tokens = Column(Integer, nullable=True)

    client = relationship("Client", back_populates="templates")
    creator = relationship("User", foreign_keys=[created_by])
    fields = relationship(
        "Field",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="Field.field_order",
    )
    documents = relationship("Document", back_populates="template")
