# backend/app/models/field.py
"""ORM model for an individual extraction field that belongs to a template."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)  # logical / output JSON key
    label = Column(String(255), nullable=True)  # human label / display
    description = Column(Text, nullable=True)  # general guidance for the LLM
    field_type = Column(String(50), nullable=True)  # text, date, number, ...
    required = Column(Boolean, default=False, nullable=False)

    # UI-builder-specific extras
    extraction_prompt = Column(Text, nullable=True)  # extraction hint sent to LLM
    positioning_hint = Column(Text, nullable=True)  # document position
    format_hint = Column(String(255), nullable=True)  # validation / format rules
    example_value = Column(Text, nullable=True)
    field_order = Column(Integer, nullable=True, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    template = relationship("Template", back_populates="fields")
    extractions = relationship(
        "Extraction", back_populates="field", cascade="all, delete-orphan"
    )
