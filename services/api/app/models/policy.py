"""
PolicyRule and PolicyVersion SQLAlchemy models
"""
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PolicyRule(Base, TimestampMixin):
    __tablename__ = "policy_rules"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    max_amount: Mapped[float] = mapped_column(Numeric(36, 18), default=100.0, nullable=False)
    allowed_targets: Mapped[str] = mapped_column(Text, default="", nullable=False)  # comma-separated addresses or '*'
    require_user_approval: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    required_role: Mapped[str] = mapped_column(String(50), default="OPERATOR", nullable=False)
    cooldown_period_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)

    history: Mapped[List["PolicyVersion"]] = relationship(
        "PolicyVersion", back_populates="policy", cascade="all, delete-orphan"
    )


class PolicyVersion(Base, TimestampMixin):
    __tablename__ = "policy_versions"

    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("policy_rules.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON dump of policy
    changed_by: Mapped[str] = mapped_column(String(100), nullable=False)
    change_reason: Mapped[str] = mapped_column(String(255), default="Policy revision", nullable=False)

    policy: Mapped["PolicyRule"] = relationship("PolicyRule", back_populates="history")
