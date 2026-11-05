"""
AgentChain AI - Autonomous Agent Planning Service
Standalone agent cognitive planning workflow.
"""
from typing import Dict, Any
from services.api.app.services.agent_service import AIAgentService


class AgentPlanner:
    def __init__(self):
        self.service = AIAgentService()

    def process_instruction(self, instruction: str) -> Dict[str, Any]:
        """Process natural language task instruction with prompt injection defense."""
        return self.service.plan_task(instruction)


if __name__ == "__main__":
    planner = AgentPlanner()
    sample = "Issue a reward of 15 tokens to recipient 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    print(f"Testing Planner with prompt: {sample}")
    res = planner.process_instruction(sample)
    print("Generated Plan Result:", res)

