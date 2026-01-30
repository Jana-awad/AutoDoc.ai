# backend/app/models/plan.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    monthly_price = Column(Integer, nullable=False, default=0)        # store money as integer cents
    max_users = Column(Integer, nullable=False, default=1)   
    allow_creation= Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    can_manage_templates = Column(Boolean, default=False)

    subscriptions = relationship("Subscription", back_populates="plan", cascade="all, delete-orphan")
