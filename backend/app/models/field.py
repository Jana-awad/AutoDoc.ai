# backend/app/models/field.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)    # logical name: invoice_number
    #label = Column(String(255), nullable=True)    # human label
    field_type = Column(String(50), nullable=True)  # text, date, number
    required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    template = relationship("Template", back_populates="fields")
    extractions = relationship("Extraction", back_populates="field", cascade="all, delete-orphan")
