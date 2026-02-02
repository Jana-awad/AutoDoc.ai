# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.enums import UserRole

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        SqlEnum(
            UserRole,
            name="user_role",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=False,
        default=UserRole.USER,
    )
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
   
    # relationships
    client = relationship("Client", back_populates="users", foreign_keys=[client_id])
    #owned_client = relationship("Client", back_populates="owner", uselist=False, foreign_keys="Client.owner_user_id")
