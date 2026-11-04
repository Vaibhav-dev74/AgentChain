"""
User and Wallet SQLAlchemy models
"""
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="USER", nullable=False)  # ADMIN, OPERATOR, AUDITOR, USER
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    wallet_address: Mapped[Optional[str]] = mapped_column(String(42), unique=True, index=True, nullable=True)

    # Relationships
    wallets: Mapped[List["Wallet"]] = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    proposals: Mapped[List["ActionProposal"]] = relationship("ActionProposal", back_populates="proposer")


class Wallet(Base, TimestampMixin):
    __tablename__ = "wallets"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    address: Mapped[str] = mapped_column(String(42), unique=True, index=True, nullable=False)
    chain_id: Mapped[int] = mapped_column(default=31337, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="wallets")
