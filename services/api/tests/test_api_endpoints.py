"""
Integration tests for FastAPI endpoints: Auth, Proposals, Policies, and Health
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_and_root():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["name"] == "AgentChain AI API"


def test_auth_and_user_flow():
    # 1. Register test user
    reg_payload = {
        "username": "testoperator",
        "email": "operator@agentchain.ai",
        "password": "SecurePassword123!",
        "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code in [201, 400]  # 400 if already created in previous run

    # 2. Login
    login_payload = {
        "username": "testoperator",
        "password": "SecurePassword123!",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    token = data["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "testoperator"

    # 4. Create proposal from natural language prompt
    prompt_payload = {
        "prompt": "Create a reward issuance proposal for 10 test tokens",
    }
    prop_res = client.post("/api/v1/proposals/from-prompt", json=prompt_payload, headers=headers)
    assert prop_res.status_code == 201
    prop_data = prop_res.json()
    assert prop_data["operation_type"] == "REWARD_ISSUANCE"
    assert prop_data["status"] in ["PENDING_APPROVAL", "POLICY_VIOLATED"]
    assert "action_id" in prop_data

    proposal_id = prop_data["id"]

    # 5. List proposals
    list_res = client.get("/api/v1/proposals")
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0

    # 6. Human approval review
    review_payload = {
        "action": "APPROVE",
        "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "signature": "0x1234567890abcdef",
    }
    rev_res = client.post(f"/api/v1/proposals/{proposal_id}/review", json=review_payload, headers=headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "APPROVED"

    # 7. Record Execution
    exec_payload = {
        "transaction_hash": "0x" + "a" * 64,
        "block_number": 1025,
        "gas_used": "45210",
        "status": "SUCCESS",
    }
    exec_res = client.post(f"/api/v1/proposals/{proposal_id}/execution", json=exec_payload, headers=headers)
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "EXECUTED"

    # 8. Check Explorer Overview
    explorer_res = client.get("/api/v1/explorer/overview")
    assert explorer_res.status_code == 200
    assert "contracts" in explorer_res.json()

    # 9. Check Analytics
    analytics_res = client.get("/api/v1/analytics/dashboard")
    assert analytics_res.status_code == 200
    assert analytics_res.json()["total_proposals"] >= 1
