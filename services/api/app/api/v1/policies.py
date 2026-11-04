"""
Policy Management & Validation Endpoints
"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.policy import PolicyRule, PolicyVersion
from app.models.agent import Agent
from app.models.user import User
from app.schemas.policy import (
    PolicyCreate,
    PolicyUpdate,
    PolicyResponse,
    PolicyValidationRequest,
    PolicyCheckResultSchema,
)
from app.core.security import get_current_user, require_roles
from app.services.policy_engine import PolicyEngine

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("", response_model=List[PolicyResponse])
def list_policies(db: Session = Depends(get_db)):
    policies = db.execute(select(PolicyRule)).scalars().all()

    return [
        PolicyResponse(
            id=p.id,
            name=p.name,
            operation_type=p.operation_type,
            max_amount=float(p.max_amount),
            allowed_targets=p.allowed_targets,
            require_user_approval=p.require_user_approval,
            required_role=p.required_role,
            cooldown_period_seconds=p.cooldown_period_seconds,
            is_active=p.is_active,
            version=p.version,
            description=p.description,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        )
        for p in policies
    ]


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: PolicyCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    existing = db.execute(select(PolicyRule).where(PolicyRule.name == policy_in.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy with specified name already exists",
        )

    policy = PolicyRule(
        name=policy_in.name,
        operation_type=policy_in.operation_type,
        max_amount=policy_in.max_amount,
        allowed_targets=policy_in.allowed_targets,
        require_user_approval=policy_in.require_user_approval,
        required_role=policy_in.required_role,
        cooldown_period_seconds=policy_in.cooldown_period_seconds,
        is_active=policy_in.is_active,
        version=1,
        description=policy_in.description,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    return PolicyResponse(
        id=policy.id,
        name=policy.name,
        operation_type=policy.operation_type,
        max_amount=float(policy.max_amount),
        allowed_targets=policy.allowed_targets,
        require_user_approval=policy.require_user_approval,
        required_role=policy.required_role,
        cooldown_period_seconds=policy.cooldown_period_seconds,
        is_active=policy.is_active,
        version=policy.version,
        description=policy.description,
        created_at=policy.created_at.isoformat(),
        updated_at=policy.updated_at.isoformat(),
    )


@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    policy = db.execute(select(PolicyRule).where(PolicyRule.id == policy_id)).scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    snapshot = {
        "name": policy.name,
        "max_amount": float(policy.max_amount),
        "allowed_targets": policy.allowed_targets,
        "version": policy.version,
    }
    history = PolicyVersion(
        policy_id=policy.id,
        version=policy.version,
        snapshot_data=json.dumps(snapshot),
        changed_by=current_user.username,
        change_reason=policy_in.change_reason,
    )
    db.add(history)

    if policy_in.name is not None:
        policy.name = policy_in.name
    if policy_in.max_amount is not None:
        policy.max_amount = policy_in.max_amount
    if policy_in.allowed_targets is not None:
        policy.allowed_targets = policy_in.allowed_targets
    if policy_in.require_user_approval is not None:
        policy.require_user_approval = policy_in.require_user_approval
    if policy_in.required_role is not None:
        policy.required_role = policy_in.required_role
    if policy_in.cooldown_period_seconds is not None:
        policy.cooldown_period_seconds = policy_in.cooldown_period_seconds
    if policy_in.is_active is not None:
        policy.is_active = policy_in.is_active
    if policy_in.description is not None:
        policy.description = policy_in.description

    policy.version += 1
    db.commit()
    db.refresh(policy)

    return PolicyResponse(
        id=policy.id,
        name=policy.name,
        operation_type=policy.operation_type,
        max_amount=float(policy.max_amount),
        allowed_targets=policy.allowed_targets,
        require_user_approval=policy.require_user_approval,
        required_role=policy.required_role,
        cooldown_period_seconds=policy.cooldown_period_seconds,
        is_active=policy.is_active,
        version=policy.version,
        description=policy.description,
        created_at=policy.created_at.isoformat(),
        updated_at=policy.updated_at.isoformat(),
    )


@router.post("/validate", response_model=PolicyCheckResultSchema)
def validate_action(
    req: PolicyValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    policy = db.execute(
        select(PolicyRule).where(PolicyRule.operation_type == req.operation_type, PolicyRule.is_active == True)
    ).scalar_one_or_none()

    agent = None
    if req.agent_address:
        agent = db.execute(
            select(Agent).where(Agent.agent_address == req.agent_address)
        ).scalar_one_or_none()

    return PolicyEngine.evaluate_rules(
        policy=policy,
        agent=agent,
        amount=req.amount,
        target_address=req.target_address,
        user_role=current_user.role,
        operation_type=req.operation_type,
    )
