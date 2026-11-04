"""
ActionProposal, ProposalApproval, and ProposalExecution SQLAlchemy models
"""
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ActionProposal(Base, TimestampMixin):
    __tablename__ = "action_proposals"

    action_id: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False)
    agent_address: Mapped[str] = mapped_column(String(42), nullable=False)
    target_address: Mapped[str] = mapped_column(String(42), nullable=False)
    call_data: Mapped[str] = mapped_column(Text, default="0x", nullable=False)
    value_wei: Mapped[str] = mapped_column(String(78), default="0", nullable=False)
    proposal_hash: Mapped[str] = mapped_column(String(66), index=True, nullable=False)

    status: Mapped[str] = mapped_column(
        String(50), default="PENDING_APPROVAL", index=True, nullable=False
    )

    # Policy Check Results
    policy_is_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    policy_risk_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    policy_violations: Mapped[str] = mapped_column(Text, default="[]", nullable=False)  # JSON array
    policy_reasons: Mapped[str] = mapped_column(Text, default="[]", nullable=False)     # JSON array

    proposed_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="proposals")
    proposer: Mapped["User"] = relationship("User", back_populates="proposals")
    approval: Mapped[Optional["ProposalApproval"]] = relationship(
        "ProposalApproval", back_populates="proposal", uselist=False, cascade="all, delete-orphan"
    )
    execution: Mapped[Optional["ProposalExecution"]] = relationship(
        "ProposalExecution", back_populates="proposal", uselist=False, cascade="all, delete-orphan"
    )


class ProposalApproval(Base, TimestampMixin):
    __tablename__ = "proposal_approvals"

    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("action_proposals.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    approved_by_wallet: Mapped[str] = mapped_column(String(42), nullable=False)
    signature: Mapped[Optional[str]] = mapped_column(String(132), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="APPROVED", nullable=False)  # APPROVED or REJECTED
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    proposal: Mapped["ActionProposal"] = relationship("ActionProposal", back_populates="approval")


class ProposalExecution(Base, TimestampMixin):
    __tablename__ = "proposal_executions"

    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("action_proposals.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    transaction_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)
    block_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    gas_used: Mapped[str] = mapped_column(String(50), default="0", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)   # SUCCESS or FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    proposal: Mapped["ActionProposal"] = relationship("ActionProposal", back_populates="execution")
