"""
Independent Policy Engine for AgentChain AI
Enforces rule verification, parameter bounds, target whitelisting, and risk scoring.
"""
import json
from datetime import datetime, timezone
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.policy import PolicyRule
from app.models.agent import Agent
from app.schemas.policy import PolicyCheckResultSchema


class PolicyEngine:
    @staticmethod
    def evaluate_rules(
        policy: Optional[PolicyRule],
        agent: Optional[Agent],
        amount: float,
        target_address: str,
        user_role: str,
        operation_type: str = "UNKNOWN",
    ) -> PolicyCheckResultSchema:
        """
        Pure deterministic policy evaluation.
        Zero side-effects, fast, robust, and verifiable.
        """
        violations: List[str] = []
        reasons: List[str] = []
        risk_score: int = 10  # Base risk score for any blockchain interaction

        # 1. Policy Existence Check
        if not policy:
            violations.append(f"No active policy exists for operation '{operation_type}'.")
            return PolicyCheckResultSchema(
                is_allowed=False,
                policy_id=None,
                violations=violations,
                reasons=["Operation is not permitted by any active governance policy."],
                risk_score=100,
                evaluated_at=datetime.now(timezone.utc).isoformat(),
            )

        if not policy.is_active:
            violations.append(f"Policy for operation '{operation_type}' is currently deactivated.")
            return PolicyCheckResultSchema(
                is_allowed=False,
                policy_id=policy.id,
                violations=violations,
                reasons=["Governance policy is suspended."],
                risk_score=100,
                evaluated_at=datetime.now(timezone.utc).isoformat(),
            )

        # 2. Amount Threshold Check
        if policy.max_amount > 0:
            if amount > float(policy.max_amount):
                violations.append(
                    f"Requested amount ({amount}) exceeds policy maximum limit ({policy.max_amount})."
                )
                risk_score += 40
            else:
                reasons.append(f"Amount {amount} is within configured threshold of {policy.max_amount}.")
                ratio = amount / float(policy.max_amount)
                risk_score += int(ratio * 30)

        # 3. Target Address Whitelist Check
        clean_target = target_address.lower().strip()
        if policy.allowed_targets and policy.allowed_targets.strip() != "*":
            allowed = [t.lower().strip() for t in policy.allowed_targets.split(",") if t.strip()]
            if clean_target not in allowed:
                violations.append(
                    f"Target address {target_address} is not in the approved whitelist for {operation_type}."
                )
                risk_score += 35
            else:
                reasons.append(f"Target address {target_address} matches policy whitelist.")

        # 4. Agent Authorization Check
        if not agent or not agent.is_active:
            violations.append("Proposing agent is inactive or unregistered.")
            risk_score = 100
        else:
            reasons.append(f"Agent '{agent.name}' is registered and active.")

        # 5. User Role Check
        role_hierarchy = {"ADMIN": 4, "OPERATOR": 3, "AUDITOR": 2, "USER": 1}
        user_level = role_hierarchy.get(user_role, 0)
        req_level = role_hierarchy.get(policy.required_role, 3)

        if user_level < req_level:
            violations.append(
                f"User role '{user_role}' is insufficient. Required role is '{policy.required_role}'."
            )
            risk_score += 25
        else:
            reasons.append(f"User role '{user_role}' meets requirement ('{policy.required_role}').")

        # 6. Cooldown
        if policy.cooldown_period_seconds > 0:
            reasons.append(f"Enforces {policy.cooldown_period_seconds}s cooldown between target executions.")

        is_allowed = len(violations) == 0
        risk_score = min(max(risk_score, 0), 100)

        return PolicyCheckResultSchema(
            is_allowed=is_allowed,
            policy_id=policy.id,
            violations=violations,
            reasons=reasons,
            risk_score=risk_score,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
        )

    @classmethod
    async def evaluate_proposal(
        cls,
        session: AsyncSession,
        operation_type: str,
        amount: float,
        target_address: str,
        agent_id: str,
        user_role: str,
    ) -> PolicyCheckResultSchema:
        """Fetch models from session and delegate to evaluate_rules."""
        query = select(PolicyRule).where(
            PolicyRule.operation_type == operation_type,
            PolicyRule.is_active == True,
        )
        result = await session.execute(query)
        policy = result.scalar_one_or_none()

        agent_query = select(Agent).where(Agent.id == agent_id)
        agent_res = await session.execute(agent_query)
        agent = agent_res.scalar_one_or_none()

        return cls.evaluate_rules(
            policy=policy,
            agent=agent,
            amount=amount,
            target_address=target_address,
            user_role=user_role,
            operation_type=operation_type,
        )
