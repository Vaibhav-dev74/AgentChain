"""
Action Proposals, Approvals, and Execution Endpoints
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, desc

from app.db.session import get_db
from app.models.proposal import ActionProposal, ProposalApproval, ProposalExecution
from app.models.blockchain import TransactionRecord
from app.models.user import User
from app.schemas.proposal import (
    ProposalPromptRequest,
    ProposalResponse,
    ProposalApprovalRequest,
    ProposalExecutionRecordRequest,
    ApprovalDetailsResponse,
    ExecutionDetailsResponse,
)
from app.schemas.policy import PolicyCheckResultSchema
from app.core.security import get_current_user, require_roles
from app.services.agent_service import AgentService

router = APIRouter(prefix="/proposals", tags=["Proposals"])


def _format_proposal(p: ActionProposal) -> ProposalResponse:
    violations = json.loads(p.policy_violations) if p.policy_violations else []
    reasons = json.loads(p.policy_reasons) if p.policy_reasons else []

    policy_result = PolicyCheckResultSchema(
        is_allowed=p.policy_is_allowed,
        violations=violations,
        reasons=reasons,
        risk_score=p.policy_risk_score,
        evaluated_at=p.created_at.isoformat(),
    )

    approval_dto = None
    if p.approval:
        approval_dto = ApprovalDetailsResponse(
            approved_by_wallet=p.approval.approved_by_wallet,
            status=p.approval.status,
            rejection_reason=p.approval.rejection_reason,
            created_at=p.approval.created_at.isoformat(),
        )

    execution_dto = None
    if p.execution:
        execution_dto = ExecutionDetailsResponse(
            transaction_hash=p.execution.transaction_hash,
            block_number=p.execution.block_number,
            gas_used=p.execution.gas_used,
            status=p.execution.status,
            error_message=p.execution.error_message,
            created_at=p.execution.created_at.isoformat(),
        )

    return ProposalResponse(
        id=p.id,
        action_id=p.action_id,
        title=p.title,
        description=p.description,
        operation_type=p.operation_type,
        agent_id=p.agent_id,
        agent_address=p.agent_address,
        target_address=p.target_address,
        call_data=p.call_data,
        value_wei=p.value_wei,
        proposal_hash=p.proposal_hash,
        status=p.status,
        policy_result=policy_result,
        proposed_by_user_id=p.proposed_by_user_id,
        approval=approval_dto,
        execution=execution_dto,
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


@router.post("/from-prompt", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal_from_prompt(
    request: ProposalPromptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Core AI Agent endpoint:
    Natural language prompt -> Injection filter -> LLM planning -> Policy Engine -> Stored Proposal
    """
    try:
        proposal = AgentService.process_user_instruction(
            session=db,
            request=request,
            current_user=current_user,
        )
        return _format_proposal(proposal)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate proposal: {str(e)}",
        )


@router.get("", response_model=List[ProposalResponse])
def list_proposals(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = (
        select(ActionProposal)
        .options(
            selectinload(ActionProposal.approval),
            selectinload(ActionProposal.execution),
        )
        .order_by(desc(ActionProposal.created_at))
    )
    if status_filter:
        query = query.where(ActionProposal.status == status_filter)

    proposals = db.execute(query).scalars().all()
    return [_format_proposal(p) for p in proposals]


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: str, db: Session = Depends(get_db)):
    proposal = db.execute(
        select(ActionProposal)
        .options(
            selectinload(ActionProposal.approval),
            selectinload(ActionProposal.execution),
        )
        .where((ActionProposal.id == proposal_id) | (ActionProposal.action_id == proposal_id))
    ).scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    return _format_proposal(proposal)


@router.post("/{proposal_id}/review", response_model=ProposalResponse)
def review_proposal(
    proposal_id: str,
    review_in: ProposalApprovalRequest,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db),
):
    """
    Human-in-the-loop review endpoint. Approves or rejects the proposal.
    """
    proposal = db.execute(
        select(ActionProposal)
        .options(
            selectinload(ActionProposal.approval),
            selectinload(ActionProposal.execution),
        )
        .where((ActionProposal.id == proposal_id) | (ActionProposal.action_id == proposal_id))
    ).scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    if proposal.status not in ["PENDING_APPROVAL", "POLICY_VIOLATED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review proposal in status '{proposal.status}'",
        )

    wallet = review_in.wallet_address or current_user.wallet_address or "0x0000000000000000000000000000000000000000"

    if review_in.action == "APPROVE":
        proposal.status = "APPROVED"
        approval = ProposalApproval(
            proposal_id=proposal.id,
            approved_by_wallet=wallet,
            signature=review_in.signature,
            status="APPROVED",
        )
    else:
        proposal.status = "REJECTED"
        approval = ProposalApproval(
            proposal_id=proposal.id,
            approved_by_wallet=wallet,
            signature=review_in.signature,
            status="REJECTED",
            rejection_reason=review_in.rejection_reason or "Rejected by operator",
        )

    db.add(approval)
    db.commit()
    db.refresh(proposal)
    return _format_proposal(proposal)


@router.post("/{proposal_id}/execution", response_model=ProposalResponse)
def record_proposal_execution(
    proposal_id: str,
    exec_in: ProposalExecutionRecordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Records confirmed on-chain execution of an approved action.
    """
    proposal = db.execute(
        select(ActionProposal)
        .options(
            selectinload(ActionProposal.approval),
            selectinload(ActionProposal.execution),
        )
        .where((ActionProposal.id == proposal_id) | (ActionProposal.action_id == proposal_id))
    ).scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    proposal.status = "EXECUTED" if exec_in.status == "SUCCESS" else "EXECUTION_FAILED"

    execution = ProposalExecution(
        proposal_id=proposal.id,
        transaction_hash=exec_in.transaction_hash,
        block_number=exec_in.block_number,
        gas_used=exec_in.gas_used,
        status=exec_in.status,
        error_message=exec_in.error_message,
    )
    db.add(execution)

    # Log in transaction_records if not already logged
    existing_tx = db.execute(
        select(TransactionRecord).where(TransactionRecord.transaction_hash == exec_in.transaction_hash)
    ).scalar_one_or_none()
    if not existing_tx:
        tx_record = TransactionRecord(
            transaction_hash=exec_in.transaction_hash,
            from_address=current_user.wallet_address or "0x0000000000000000000000000000000000000000",
            to_address=proposal.target_address,
            value_wei=proposal.value_wei,
            gas_used=exec_in.gas_used,
            status=exec_in.status,
            block_number=exec_in.block_number,
            input_data=proposal.call_data,
        )
        db.add(tx_record)

    db.commit()
    db.refresh(proposal)
    return _format_proposal(proposal)
