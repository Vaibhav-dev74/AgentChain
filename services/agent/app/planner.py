"""
AgentChain AI - Autonomous Agent Planning Service
Standalone agent cognitive planning workflow.
"""
from typing import Dict, Any
from app.services.agent_service import AgentService
from app.models.user import User


class AgentPlanner:
    @staticmethod
    def process_instruction(instruction: str, user_wallet: str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") -> Dict[str, Any]:
        """Process natural language task instruction with prompt injection defense."""
        threat = AgentService.detect_prompt_injection(instruction)
        if threat:
            return {
                "blocked": True,
                "reason": threat,
                "operation_type": "REJECTED_INPUT",
            }

        mock_user = User(
            id="planner-standalone",
            username="planner",
            email="planner@agentchain.ai",
            hashed_password="",
            wallet_address=user_wallet,
        )
        parsed = AgentService._parse_instruction(instruction, mock_user)
        parsed["blocked"] = False
        return parsed


if __name__ == "__main__":
    planner = AgentPlanner()
    sample = "Issue a reward of 15 tokens to recipient 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    print(f"Testing Planner with prompt: {sample}")
    res = planner.process_instruction(sample)
    print("Generated Plan Result:", res)
