"""
BlockchainEvent, TransactionRecord, and AuditLog SQLAlchemy models
"""
from typing import Optional
from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class BlockchainEvent(Base, TimestampMixin):
    __tablename__ = "blockchain_events"

    event_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    contract_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    transaction_hash: Mapped[str] = mapped_column(String(66), index=True, nullable=False)
    block_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    log_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    parameters: Mapped[str] = mapped_column(Text, default="{}", nullable=False)  # JSON payload


class TransactionRecord(Base, TimestampMixin):
    __tablename__ = "transaction_records"

    transaction_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)
    from_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    to_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    value_wei: Mapped[str] = mapped_column(String(78), default="0", nullable=False)
    gas_used: Mapped[str] = mapped_column(String(50), default="0", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="SUCCESS", index=True, nullable=False)  # SUCCESS, FAILED
    block_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    input_data: Mapped[str] = mapped_column(Text, default="0x", nullable=False)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(66), index=True, nullable=True)
    details: Mapped[str] = mapped_column(Text, default="{}", nullable=False)  # JSON details
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
