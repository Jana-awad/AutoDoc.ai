# backend/app/models/extraction.py
from sqlalchemy import Column, Integer, ForeignKey, Text, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Extraction(Base):
    __tablename__ = "extractions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True, index=True)
    value_text = Column(Text, nullable=True)
    value_json = Column(JSONB, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="extractions")
    field = relationship("Field", back_populates="extractions")
