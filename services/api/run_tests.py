"""
Comprehensive Test Runner for AgentChain AI Backend
Verifies prompt injection defense, proposal parsing, policy validation,
and end-to-end API workflows with zero network/port dependencies.
"""
import sys
import os
import uuid

# Ensure services/api is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tests.test_agent_service import test_prompt_injection_defense, test_parse_reward_instruction
from tests.test_policy_engine import test_policy_engine_validation
from app.db.session import init_db, SessionLocal
from app.schemas.user import UserCreate, UserLogin
from app.schemas.proposal import (
    ProposalPromptRequest,
    ProposalApprovalRequest,
    ProposalExecutionRecordRequest,
)
from app.api.v1.auth import register, login
from app.api.v1.proposals import (
    create_proposal_from_prompt,
    review_proposal,
    record_proposal_execution,
    list_proposals,
)
from app.api.v1.explorer import get_explorer_overview
from app.api.v1.analytics import get_analytics_dashboard


def run_api_workflow_tests():
    print("4. Initializing Database and Verifying API Workflows...")
    init_db()

    with SessionLocal() as db:
        # Auth: Register or retrieve demo operator
        reg_payload = UserCreate(
            username="demouser_auto",
            email="demouser_auto@agentchain.ai",
            password="SecurePassword123!",
            wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        )
        try:
            auth_token = register(reg_payload, db)
            print("   [PASS] User registration and JWT generation verified.")
        except Exception:
            # Already created from prior run
            auth_token = login(UserLogin(username="demouser_auto", password="SecurePassword123!"), db)
            print("   [PASS] User login and JWT retrieval verified.")

        current_user = auth_token.user

        # Fetch active user model
        from app.models.user import User
        user_model = db.query(User).filter(User.id == current_user.id).first()

        # Proposal creation from prompt
        prompt_req = ProposalPromptRequest(
            prompt="Create a reward issuance proposal for 10 test tokens"
        )
        proposal = create_proposal_from_prompt(prompt_req, user_model, db)
        assert proposal.operation_type == "REWARD_ISSUANCE"
        assert proposal.status in ["PENDING_APPROVAL", "POLICY_VIOLATED"]
        print(f"   [PASS] AI Proposal generated: {proposal.action_id[:16]}... ({proposal.title})")

        # Review & Approve
        review_req = ProposalApprovalRequest(
            action="APPROVE",
            wallet_address=user_model.wallet_address,
            signature="0x1234567890abcdef",
        )
        approved = review_proposal(proposal.id, review_req, user_model, db)
        assert approved.status == "APPROVED"
        print("   [PASS] Human Approval recorded successfully.")

        # Record Execution Receipt with unique transaction hash
        random_tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        exec_req = ProposalExecutionRecordRequest(
            transaction_hash=random_tx_hash,
            block_number=2050,
            gas_used="51200",
            status="SUCCESS",
        )
        executed = record_proposal_execution(proposal.id, exec_req, user_model, db)
        assert executed.status == "EXECUTED"
        print("   [PASS] Smart contract execution receipt recorded.")

        # Explorer Overview
        overview = get_explorer_overview(db)
        assert len(overview.contracts) >= 4
        print(f"   [PASS] Blockchain Explorer verified with {len(overview.contracts)} verified contracts.")

        # Analytics Dashboard
        analytics = get_analytics_dashboard(db)
        assert analytics.total_proposals >= 1
        assert analytics.successful_executions >= 1
        print(f"   [PASS] Analytics verified: {analytics.total_proposals} proposals, {analytics.successful_executions} executions.")


def main():
    print("-------------------------------------------------------")
    print("AgentChain AI - Automated Backend Verification Suite")
    print("-------------------------------------------------------")

    # 1. Agent Service Tests
    print("1. Testing Prompt Injection Defense...")
    test_prompt_injection_defense()
    print("   [PASS] Prompt injection defense verified.")

    print("2. Testing Intent & Proposal Parsing...")
    test_parse_reward_instruction()
    print("   [PASS] Reward issuance intent parsing verified.")

    # 2. Policy Engine Tests
    print("3. Testing Policy Engine Threshold & Whitelist Evaluation...")
    test_policy_engine_validation()
    print("   [PASS] Policy engine validation verified.")

    # 3. API Workflows
    run_api_workflow_tests()

    print("-------------------------------------------------------")
    print("All Backend Services, AI Agent & Policy Tests PASSED!")
    print("-------------------------------------------------------")


if __name__ == "__main__":
    main()
