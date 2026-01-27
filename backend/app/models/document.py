# backend/app/models/document.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True, index=True)
   # filename = Column(String(1024), nullable=False)
    file_url = Column(String(2048), nullable=True)
    #file_size = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False, default="uploaded")  # uploaded, processing, done, failed
   # metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    client = relationship("Client", back_populates="documents")
    template = relationship("Template", back_populates="documents")
    extractions = relationship("Extraction", back_populates="document", cascade="all, delete-orphan")
