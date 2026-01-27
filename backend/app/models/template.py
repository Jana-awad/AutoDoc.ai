# backend/app/models/template.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)  # null => global template
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
   
   # version = Column(String(50), nullable=True)
    is_global = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="templates")
    fields = relationship("Field", back_populates="template", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="template")
