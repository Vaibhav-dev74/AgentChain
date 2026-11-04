"""
Agent and AgentPermission SQLAlchemy models
"""
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    agent_address: Mapped[str] = mapped_column(String(42), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(66), default="AGENT_ROLE", nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    registered_by: Mapped[str] = mapped_column(String(42), nullable=False)
    metadata_uri: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    permissions: Mapped[List["AgentPermission"]] = relationship(
        "AgentPermission", back_populates="agent", cascade="all, delete-orphan"
    )
    proposals: Mapped[List["ActionProposal"]] = relationship("ActionProposal", back_populates="agent")


class AgentPermission(Base, TimestampMixin):
    __tablename__ = "agent_permissions"

    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    max_amount: Mapped[float] = mapped_column(Numeric(36, 18), default=0.0, nullable=False)
    is_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    agent: Mapped["Agent"] = relationship("Agent", back_populates="permissions")
