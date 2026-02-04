# backend/app/models/client.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    #phone = Column(String(50), nullable=True)
    api_key = Column(String(255), unique=True, nullable=True, index=True)
    #billing_contact = Column(String(255), nullable=True)
   # address = Column(String(500), nullable=True)
    #is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # optional owner user (one-to-one-ish): a user who is primary admin for this client
   # owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # relationships
    users = relationship("User", back_populates="client", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="client", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="client", cascade="all, delete-orphan")
    api_logs = relationship("ApiLog", back_populates="client", cascade="all, delete-orphan")
    #owner = relationship("User", back_populates="owned_client", foreign_keys=[owner_user_id], uselist=False)
