"""
Blockchain and Explorer Pydantic Schemas
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class BlockchainEventResponse(BaseModel):
    id: str
    event_name: str
    contract_address: str
    transaction_hash: str
    block_number: int
    log_index: int
    parameters: Dict[str, Any]
    created_at: str

    class Config:
        from_attributes = True


class TransactionRecordResponse(BaseModel):
    id: str
    transaction_hash: str
    from_address: str
    to_address: str
    value_wei: str
    gas_used: str
    status: str
    block_number: int
    input_data: str
    created_at: str

    class Config:
        from_attributes = True


class ContractInfo(BaseModel):
    name: str
    address: str
    chain_id: int
    verified: bool = True


class ExplorerOverviewResponse(BaseModel):
    chain_id: int
    network_name: str
    latest_block: int
    contracts: List[ContractInfo]
    recent_transactions: List[TransactionRecordResponse]
    recent_events: List[BlockchainEventResponse]
