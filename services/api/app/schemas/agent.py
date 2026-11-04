"""
Agent and Permission Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    agent_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")
    role: str = "AGENT_ROLE"
    description: str = ""
    metadata_uri: Optional[str] = None


class AgentStatusUpdate(BaseModel):
    is_active: bool


class AgentPermissionSchema(BaseModel):
    id: str
    operation_type: str
    max_amount: float
    is_allowed: bool

    class Config:
        from_attributes = True


class AgentResponse(BaseModel):
    id: str
    name: str
    agent_address: str
    role: str
    description: str
    is_active: bool
    registered_by: str
    metadata_uri: Optional[str]
    created_at: str
    permissions: List[AgentPermissionSchema] = []

    class Config:
        from_attributes = True
