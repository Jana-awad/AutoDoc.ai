# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")  # admin, user, superadmin
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
   
    # relationships
    client = relationship("Client", back_populates="users", foreign_keys=[client_id])
    #owned_client = relationship("Client", back_populates="owner", uselist=False, foreign_keys="Client.owner_user_id")
