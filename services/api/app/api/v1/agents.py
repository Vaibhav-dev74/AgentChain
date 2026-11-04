"""
Agent Management API Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db.session import get_db
from app.models.agent import Agent, AgentPermission
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentResponse, AgentStatusUpdate, AgentPermissionSchema
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    agents = db.execute(select(Agent).options(selectinload(Agent.permissions))).scalars().all()

    return [
        AgentResponse(
            id=a.id,
            name=a.name,
            agent_address=a.agent_address,
            role=a.role,
            description=a.description,
            is_active=a.is_active,
            registered_by=a.registered_by,
            metadata_uri=a.metadata_uri,
            created_at=a.created_at.isoformat(),
            permissions=[
                AgentPermissionSchema(
                    id=p.id,
                    operation_type=p.operation_type,
                    max_amount=float(p.max_amount),
                    is_allowed=p.is_allowed,
                )
                for p in a.permissions
            ],
        )
        for a in agents
    ]


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def register_agent(
    agent_in: AgentCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db),
):
    existing = db.execute(
        select(Agent).where((Agent.name == agent_in.name) | (Agent.agent_address == agent_in.agent_address))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent with specified name or address already exists",
        )

    agent = Agent(
        name=agent_in.name,
        agent_address=agent_in.agent_address,
        role=agent_in.role,
        description=agent_in.description,
        is_active=True,
        registered_by=current_user.wallet_address or current_user.username,
        metadata_uri=agent_in.metadata_uri,
    )
    db.add(agent)
    db.flush()

    perm = AgentPermission(
        agent_id=agent.id,
        operation_type="REWARD_ISSUANCE",
        max_amount=50.0,
        is_allowed=True,
    )
    db.add(perm)

    db.commit()
    db.refresh(agent)

    return AgentResponse(
        id=agent.id,
        name=agent.name,
        agent_address=agent.agent_address,
        role=agent.role,
        description=agent.description,
        is_active=agent.is_active,
        registered_by=agent.registered_by,
        metadata_uri=agent.metadata_uri,
        created_at=agent.created_at.isoformat(),
        permissions=[
            AgentPermissionSchema(
                id=perm.id,
                operation_type=perm.operation_type,
                max_amount=float(perm.max_amount),
                is_allowed=perm.is_allowed,
            )
        ],
    )


@router.patch("/{agent_id}/status", response_model=AgentResponse)
def update_agent_status(
    agent_id: str,
    status_in: AgentStatusUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db),
):
    agent = db.execute(
        select(Agent).options(selectinload(Agent.permissions)).where(Agent.id == agent_id)
    ).scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    agent.is_active = status_in.is_active
    db.commit()
    db.refresh(agent)

    return AgentResponse(
        id=agent.id,
        name=agent.name,
        agent_address=agent.agent_address,
        role=agent.role,
        description=agent.description,
        is_active=agent.is_active,
        registered_by=agent.registered_by,
        metadata_uri=agent.metadata_uri,
        created_at=agent.created_at.isoformat(),
        permissions=[
            AgentPermissionSchema(
                id=p.id,
                operation_type=p.operation_type,
                max_amount=float(p.max_amount),
                is_allowed=p.is_allowed,
            )
            for p in agent.permissions
        ],
    )
