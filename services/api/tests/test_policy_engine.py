"""
Unit tests for the Policy Engine and Risk Evaluation
"""
from app.models.policy import PolicyRule
from app.models.agent import Agent
from app.services.policy_engine import PolicyEngine


def test_policy_engine_validation():
    # 1. Setup mock agent
    agent = Agent(
        id="agent-001",
        name="Sentinel Agent",
        agent_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        role="AGENT_ROLE",
        is_active=True,
        registered_by="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    )

    # 2. Setup mock policy for REWARD_ISSUANCE
    policy = PolicyRule(
        id="policy-001",
        name="Reward Policy",
        operation_type="REWARD_ISSUANCE",
        max_amount=50.0,
        allowed_targets="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        require_user_approval=True,
        required_role="OPERATOR",
        cooldown_period_seconds=10,
        is_active=True,
        version=1,
    )

    # 3. Test Valid Request (amount 10 <= 50, whitelisted target, active agent, OPERATOR role)
    valid_res = PolicyEngine.evaluate_rules(
        policy=policy,
        agent=agent,
        amount=10.0,
        target_address="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        user_role="OPERATOR",
        operation_type="REWARD_ISSUANCE",
    )
    assert valid_res.is_allowed is True
    assert len(valid_res.violations) == 0
    assert valid_res.risk_score < 50

    # 4. Test Amount Exceeding Threshold (amount 100 > 50)
    excess_res = PolicyEngine.evaluate_rules(
        policy=policy,
        agent=agent,
        amount=100.0,
        target_address="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        user_role="OPERATOR",
        operation_type="REWARD_ISSUANCE",
    )
    assert excess_res.is_allowed is False
    assert any("exceeds policy maximum limit" in v for v in excess_res.violations)

    # 5. Test Unwhitelisted Target Address
    unwhitelisted_res = PolicyEngine.evaluate_rules(
        policy=policy,
        agent=agent,
        amount=10.0,
        target_address="0x000000000000000000000000000000000000dEaD",
        user_role="OPERATOR",
        operation_type="REWARD_ISSUANCE",
    )
    assert unwhitelisted_res.is_allowed is False
    assert any("not in the approved whitelist" in v for v in unwhitelisted_res.violations)

    # 6. Test Inactive Agent
    inactive_agent = Agent(
        id="agent-002",
        name="Deactivated Agent",
        agent_address="0x1111111111111111111111111111111111111111",
        is_active=False,
        registered_by="0x0",
    )
    inactive_res = PolicyEngine.evaluate_rules(
        policy=policy,
        agent=inactive_agent,
        amount=5.0,
        target_address="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        user_role="OPERATOR",
        operation_type="REWARD_ISSUANCE",
    )
    assert inactive_res.is_allowed is False
    assert any("inactive or unregistered" in v for v in inactive_res.violations)
