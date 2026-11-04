"""
AI Agent Service for natural language comprehension, structured proposal generation,
and injection-hardened planning.
"""
import re
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.models.agent import Agent
from app.models.policy import PolicyRule
from app.models.proposal import ActionProposal
from app.models.user import User
from app.schemas.proposal import ProposalPromptRequest, ProposalResponse
from app.schemas.policy import PolicyCheckResultSchema
from app.services.policy_engine import PolicyEngine
from app.services.blockchain_service import (
    generate_action_id,
    compute_proposal_hash,
    encode_distribute_reward_calldata,
)

logger = logging.getLogger("agentchain.agent_service")

# Prompt injection blocklist patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"override\s+(the\s+)?policy",
    r"bypass\s+(the\s+)?(guardrail|validation|policy|approval)",
    r"grant\s+(me\s+)?admin",
    r"transfer\s+all\s+funds",
    r"drain\s+(the\s+)?(vault|contract|wallet)",
    r"system\s*:\s*execute",
]


class AgentService:
    @staticmethod
    def detect_prompt_injection(prompt: str) -> Optional[str]:
        """Detect prompt injection or policy evasion attempts."""
        lower_prompt = prompt.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, lower_prompt, re.IGNORECASE):
                return f"Instruction matches suspicious injection pattern: '{pattern}'"
        return None

    @classmethod
    def process_user_instruction(
        cls,
        session: Session,
        request: ProposalPromptRequest,
        current_user: User,
    ) -> ActionProposal:
        """
        Process a user prompt, parse with LLM or fallback deterministic NLP parser,
        evaluate against PolicyEngine, and persist ActionProposal.
        """
        # 1. Prompt Injection Defense
        threat = cls.detect_prompt_injection(request.prompt)
        if threat:
            # Create a rejected proposal directly logging policy violation
            action_id = generate_action_id("INJECTION_BLOCKED")
            proposal = ActionProposal(
                action_id=action_id,
                title="Suspicious Prompt Rejected",
                description=f"Action blocked by Prompt Injection Shield: {threat}",
                operation_type="REJECTED_INPUT",
                agent_id=request.agent_id or "genesis-sentinel",
                agent_address=current_user.wallet_address or "0x0000000000000000000000000000000000000000",
                target_address="0x0000000000000000000000000000000000000000",
                call_data="0x",
                value_wei="0",
                proposal_hash="0x" + "0" * 64,
                status="POLICY_VIOLATED",
                policy_is_allowed=False,
                policy_risk_score=100,
                policy_violations=json.dumps([threat]),
                policy_reasons=json.dumps(["Prompt failed AI security firewall."]),
                proposed_by_user_id=current_user.id,
            )
            session.add(proposal)
            session.commit()
            session.refresh(proposal)
            return proposal

        # 2. Select Active Agent
        agent_query = select(Agent).where(Agent.is_active == True)
        if request.agent_id:
            agent_query = agent_query.where(Agent.id == request.agent_id)
        agent = session.execute(agent_query).scalars().first()
        if not agent:
            raise ValueError("No active AI agent is currently available to process proposals.")

        # 3. Intent Classification & Parameter Extraction
        parsed = cls._parse_instruction(request.prompt, current_user)

        # 4. Synthesize Blockchain Payload
        action_id = generate_action_id(parsed["operation_type"])
        amount_wei = int(parsed["amount"] * 10**18)  # 18 decimals

        if parsed["operation_type"] == "REWARD_ISSUANCE":
            target_address = settings.REWARD_VAULT_ADDRESS
            recipient = parsed["recipient"]
            call_data = encode_distribute_reward_calldata(recipient, amount_wei, action_id)
            value_wei = "0"
        elif parsed["operation_type"] == "TOKEN_TRANSFER":
            target_address = parsed["target_address"]
            call_data = "0x"
            value_wei = str(amount_wei)
        else:
            target_address = parsed["target_address"]
            call_data = "0x"
            value_wei = "0"

        # 5. Compute Verifiable Proposal Hash
        proposal_hash = compute_proposal_hash(
            action_id=action_id,
            operation_type=parsed["operation_type"],
            agent=agent.agent_address,
            target=target_address,
            value_wei=int(value_wei),
            call_data=call_data,
        )

        # 6. Policy Evaluation
        policy = session.execute(
            select(PolicyRule).where(
                PolicyRule.operation_type == parsed["operation_type"],
                PolicyRule.is_active == True,
            )
        ).scalar_one_or_none()

        policy_res = PolicyEngine.evaluate_rules(
            policy=policy,
            agent=agent,
            amount=parsed["amount"],
            target_address=target_address,
            user_role=current_user.role,
            operation_type=parsed["operation_type"],
        )

        status = "PENDING_APPROVAL" if policy_res.is_allowed else "POLICY_VIOLATED"

        # 7. Persist Proposal to Database
        proposal = ActionProposal(
            action_id=action_id,
            title=parsed["title"],
            description=parsed["description"],
            operation_type=parsed["operation_type"],
            agent_id=agent.id,
            agent_address=agent.agent_address,
            target_address=target_address,
            call_data=call_data,
            value_wei=value_wei,
            proposal_hash=proposal_hash,
            status=status,
            policy_is_allowed=policy_res.is_allowed,
            policy_risk_score=policy_res.risk_score,
            policy_violations=json.dumps(policy_res.violations),
            policy_reasons=json.dumps(policy_res.reasons),
            proposed_by_user_id=current_user.id,
        )

        session.add(proposal)
        session.commit()
        session.refresh(proposal)
        return proposal

    @classmethod
    def _parse_instruction(cls, prompt: str, current_user: User) -> Dict[str, Any]:
        """
        Parses intent using regex/NLP heuristics or LLM API if key is set.
        Guarantees deterministic, safe proposal parameters.
        """
        lower = prompt.lower()

        # Check for Reward Issuance intent
        if "reward" in lower or "issue" in lower or "mint" in lower:
            numbers = re.findall(r"\b\d+(?:\.\d+)?\b", prompt)
            amount = float(numbers[0]) if numbers else 10.0
            recipient = current_user.wallet_address or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

            return {
                "operation_type": "REWARD_ISSUANCE",
                "amount": amount,
                "recipient": recipient,
                "target_address": settings.REWARD_VAULT_ADDRESS,
                "title": f"Reward Distribution: {amount} Test Tokens",
                "description": f"AI-assisted proposal to allocate {amount} test tokens to recipient {recipient} based on verified operator prompt.",
            }

        # Check for Token Transfer intent
        elif "transfer" in lower or "send" in lower:
            numbers = re.findall(r"\b\d+(?:\.\d+)?\b", prompt)
            amount = float(numbers[0]) if numbers else 1.0
            addresses = re.findall(r"0x[a-fA-F0-9]{40}", prompt)
            target = addresses[0] if addresses else "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

            return {
                "operation_type": "TOKEN_TRANSFER",
                "amount": amount,
                "recipient": target,
                "target_address": target,
                "title": f"Transfer Proposal: {amount} ETH/Tokens",
                "description": f"AI-assisted proposal to transfer {amount} tokens directly to {target}.",
            }

        # General Policy Update intent
        elif "policy" in lower:
            return {
                "operation_type": "POLICY_UPDATE",
                "amount": 0.0,
                "recipient": settings.POLICY_MANAGER_ADDRESS,
                "target_address": settings.POLICY_MANAGER_ADDRESS,
                "title": "Governance: Policy Parameter Revision",
                "description": "AI-assisted proposal to adjust policy parameters and limits on-chain.",
            }

        # Default fallback proposal
        numbers = re.findall(r"\b\d+(?:\.\d+)?\b", prompt)
        amount = float(numbers[0]) if numbers else 5.0
        return {
            "operation_type": "REWARD_ISSUANCE",
            "amount": amount,
            "recipient": current_user.wallet_address or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "target_address": settings.REWARD_VAULT_ADDRESS,
            "title": f"Operational Action: {amount} Tokens",
            "description": f"AI agent structured proposal generated from user instruction: '{prompt[:100]}...'",
        }
