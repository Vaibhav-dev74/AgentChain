"""
Analytics Pydantic Schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    timestamp: str
    status: str
    tx_hash: Optional[str] = None


class TrendPoint(BaseModel):
    date: str
    proposals: int
    executions: int


class AnalyticsDashboardResponse(BaseModel):
    total_proposals: int
    approved_proposals: int
    rejected_proposals: int
    successful_executions: int
    failed_executions: int
    policy_violations: int
    active_agents_count: int
    total_gas_used: str
    recent_activity: List[ActivityItem]
    daily_trends: List[TrendPoint]
