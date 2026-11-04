"""
Action Proposal, Approval, and Execution Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.policy import PolicyCheckResultSchema


class ProposalPromptRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=1000)
    agent_id: Optional[str] = None


class ProposalApprovalRequest(BaseModel):
    action: str = Field(pattern=r"^(APPROVE|REJECT)$")
    rejection_reason: Optional[str] = None
    signature: Optional[str] = None
    wallet_address: Optional[str] = None


class ProposalExecutionRecordRequest(BaseModel):
    transaction_hash: str = Field(pattern=r"^0x[a-fA-F0-9]{64}$")
    block_number: int
    gas_used: str = "0"
    status: str = "SUCCESS"
    error_message: Optional[str] = None


class ApprovalDetailsResponse(BaseModel):
    approved_by_wallet: str
    status: str
    rejection_reason: Optional[str]
    created_at: str


class ExecutionDetailsResponse(BaseModel):
    transaction_hash: str
    block_number: int
    gas_used: str
    status: str
    error_message: Optional[str]
    created_at: str


class ProposalResponse(BaseModel):
    id: str
    action_id: str
    title: str
    description: str
    operation_type: str
    agent_id: str
    agent_address: str
    target_address: str
    call_data: str
    value_wei: str
    proposal_hash: str
    status: str
    policy_result: PolicyCheckResultSchema
    proposed_by_user_id: str
    approval: Optional[ApprovalDetailsResponse] = None
    execution: Optional[ExecutionDetailsResponse] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
