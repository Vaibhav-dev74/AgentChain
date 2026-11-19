"""
Integration tests for FastAPI endpoints: Auth, Proposals, Policies, and Health.
Calls endpoints directly to avoid AnyIO/Starlette thread deadlocks on Python 3.13 Windows.
"""
import uuid
import pytest
from main import root, health_check
from app.db.session import init_db, SessionLocal
from app.schemas.user import UserCreate, UserLogin
from app.schemas.proposal import (
    ProposalPromptRequest,
    ProposalApprovalRequest,
    ProposalExecutionRecordRequest,
)
from app.api.v1.auth import register, login, get_me
from app.api.v1.proposals import (
    create_proposal_from_prompt,
    list_proposals,
    get_proposal,
    review_proposal,
    record_proposal_execution,
)
from app.api.v1.explorer import get_explorer_overview, list_transactions
from app.api.v1.analytics import get_analytics_dashboard
from app.api.v1.policies import list_policies


def test_health_and_root():
    health = health_check()
    assert health["status"] == "healthy"

    r = root()
    assert r["name"] == "AgentChain AI API"
    assert r["status"] == "online"


def test_auth_and_user_flow():
    init_db()

    with SessionLocal() as db:
        unique_suffix = uuid.uuid4().hex[:8]
        test_username = f"user_{unique_suffix}"
        test_email = f"user_{unique_suffix}@agentchain.ai"
        test_wallet = f"0x{(uuid.uuid4().hex + uuid.uuid4().hex)[:40]}"

        # 1. Register
        reg_payload = UserCreate(
            username=test_username,
            email=test_email,
            password="SecurePassword123!",
            wallet_address=test_wallet,
        )
        token_res = register(reg_payload, db)
        assert token_res.access_token is not None
        assert token_res.user.username == test_username

        # 2. Login
        login_payload = UserLogin(
            username=test_username,
            password="SecurePassword123!",
        )
        login_res = login(login_payload, db)
        assert login_res.access_token is not None

        # 3. Profile
        from app.models.user import User
        user_model = db.query(User).filter(User.id == token_res.user.id).first()
        profile = get_me(user_model)
        assert profile.username == test_username

        # 4. Create proposal from prompt
        prompt_req = ProposalPromptRequest(
            prompt="Create a reward issuance proposal for 10 test tokens"
        )
        proposal = create_proposal_from_prompt(prompt_req, user_model, db)
        assert proposal.operation_type == "REWARD_ISSUANCE"
        assert proposal.status in ["PENDING_APPROVAL", "POLICY_VIOLATED"]
        assert proposal.action_id is not None

        # 5. List proposals
        all_props = list_proposals(None, db)
        assert len(all_props) >= 1

        # 6. Get proposal
        single = get_proposal(proposal.id, db)
        assert single.id == proposal.id

        # 7. Review proposal
        review_req = ProposalApprovalRequest(
            action="APPROVE",
            wallet_address=user_model.wallet_address,
            signature="0x1234567890abcdef",
        )
        approved = review_proposal(proposal.id, review_req, user_model, db)
        assert approved.status == "APPROVED"

        # 8. Execution
        random_tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        exec_req = ProposalExecutionRecordRequest(
            transaction_hash=random_tx_hash,
            block_number=1025,
            gas_used="45210",
            status="SUCCESS",
        )
        executed = record_proposal_execution(proposal.id, exec_req, user_model, db)
        assert executed.status == "EXECUTED"

        # 9. Explorer overview
        overview = get_explorer_overview(db)
        assert len(overview.contracts) >= 4

        # 10. List explorer transactions
        txs = list_transactions(db)
        assert len(txs) >= 1

        # 11. Analytics
        analytics = get_analytics_dashboard(db)
        assert analytics.total_proposals >= 1
        assert analytics.successful_executions >= 1

        # 12. Policies
        policies = list_policies(db)
        assert len(policies) >= 1
