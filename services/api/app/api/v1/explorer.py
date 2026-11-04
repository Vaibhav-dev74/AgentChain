"""
Blockchain Explorer Endpoints
"""
import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.db.session import get_db
from app.models.blockchain import BlockchainEvent, TransactionRecord
from app.schemas.blockchain import (
    ExplorerOverviewResponse,
    ContractInfo,
    TransactionRecordResponse,
    BlockchainEventResponse,
)
from app.core.config import settings
from app.services.blockchain_service import BlockchainService

router = APIRouter(prefix="/explorer", tags=["Blockchain Explorer"])


@router.get("/overview", response_model=ExplorerOverviewResponse)
def get_explorer_overview(db: Session = Depends(get_db)):
    deployed = BlockchainService.get_deployed_contracts()

    # Query recent transactions
    transactions = db.execute(
        select(TransactionRecord).order_by(desc(TransactionRecord.created_at)).limit(10)
    ).scalars().all()

    # Query recent events
    events = db.execute(
        select(BlockchainEvent).order_by(desc(BlockchainEvent.created_at)).limit(15)
    ).scalars().all()

    network_name = "Ethereum Sepolia" if settings.CHAIN_ID == 11155111 else "AgentChain Local EVM"

    return ExplorerOverviewResponse(
        chain_id=settings.CHAIN_ID,
        network_name=network_name,
        latest_block=1024,
        contracts=[
            ContractInfo(name=name, address=addr, chain_id=settings.CHAIN_ID, verified=True)
            for name, addr in deployed.items()
        ],
        recent_transactions=[
            TransactionRecordResponse(
                id=t.id,
                transaction_hash=t.transaction_hash,
                from_address=t.from_address,
                to_address=t.to_address,
                value_wei=t.value_wei,
                gas_used=t.gas_used,
                status=t.status,
                block_number=t.block_number,
                input_data=t.input_data,
                created_at=t.created_at.isoformat(),
            )
            for t in transactions
        ],
        recent_events=[
            BlockchainEventResponse(
                id=e.id,
                event_name=e.event_name,
                contract_address=e.contract_address,
                transaction_hash=e.transaction_hash,
                block_number=e.block_number,
                log_index=e.log_index,
                parameters=json.loads(e.parameters) if e.parameters else {},
                created_at=e.created_at.isoformat(),
            )
            for e in events
        ],
    )


@router.get("/transactions", response_model=List[TransactionRecordResponse])
def list_transactions(db: Session = Depends(get_db)):
    transactions = db.execute(
        select(TransactionRecord).order_by(desc(TransactionRecord.created_at)).limit(50)
    ).scalars().all()

    return [
        TransactionRecordResponse(
            id=t.id,
            transaction_hash=t.transaction_hash,
            from_address=t.from_address,
            to_address=t.to_address,
            value_wei=t.value_wei,
            gas_used=t.gas_used,
            status=t.status,
            block_number=t.block_number,
            input_data=t.input_data,
            created_at=t.created_at.isoformat(),
        )
        for t in transactions
    ]


@router.get("/events", response_model=List[BlockchainEventResponse])
def list_events(db: Session = Depends(get_db)):
    events = db.execute(
        select(BlockchainEvent).order_by(desc(BlockchainEvent.created_at)).limit(50)
    ).scalars().all()

    return [
        BlockchainEventResponse(
            id=e.id,
            event_name=e.event_name,
            contract_address=e.contract_address,
            transaction_hash=e.transaction_hash,
            block_number=e.block_number,
            log_index=e.log_index,
            parameters=json.loads(e.parameters) if e.parameters else {},
            created_at=e.created_at.isoformat(),
        )
        for e in events
    ]
