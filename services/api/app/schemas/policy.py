"""
Policy Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class PolicyCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    operation_type: str
    max_amount: float = Field(ge=0.0)
    allowed_targets: str = ""  # Comma separated or "*"
    require_user_approval: bool = True
    required_role: str = "OPERATOR"
    cooldown_period_seconds: int = 0
    is_active: bool = True
    description: str = ""


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    max_amount: Optional[float] = None
    allowed_targets: Optional[str] = None
    require_user_approval: Optional[bool] = None
    required_role: Optional[str] = None
    cooldown_period_seconds: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    change_reason: str = "Policy parameters updated"


class PolicyCheckResultSchema(BaseModel):
    is_allowed: bool
    policy_id: Optional[str] = None
    violations: List[str] = []
    reasons: List[str] = []
    risk_score: int = 0  # 0 to 100
    evaluated_at: str


class PolicyValidationRequest(BaseModel):
    operation_type: str
    target_address: str
    amount: float
    agent_address: Optional[str] = None


class PolicyResponse(BaseModel):
    id: str
    name: str
    operation_type: str
    max_amount: float
    allowed_targets: str
    require_user_approval: bool
    required_role: str
    cooldown_period_seconds: int
    is_active: bool
    version: int
    description: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
