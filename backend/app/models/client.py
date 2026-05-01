# backend/app/models/client.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    country = Column(String(120), nullable=True)
    industry = Column(String(120), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    api_key = Column(String(255), unique=True, nullable=True, index=True)
    billing_history_cleared_at = Column(DateTime(timezone=True), nullable=True)
    settings = Column(JSONB, nullable=True)

    # relationships
    users = relationship("User", back_populates="client", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="client", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="client", cascade="all, delete-orphan")
    api_logs = relationship("ApiLog", back_populates="client", cascade="all, delete-orphan")
