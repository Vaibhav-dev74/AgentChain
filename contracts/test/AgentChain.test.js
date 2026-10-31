const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AgentChain AI Smart Contract Suite", function () {
  let admin, agentSigner, userSigner, attacker;
  let agentRegistry, policyManager, actionLedger, rewardVault;
  let REWARD_ISSUANCE_OP, AGENT_ROLE, OPERATOR_ROLE;

  beforeEach(async function () {
    [admin, agentSigner, userSigner, attacker] = await ethers.getSigners();

    // 1. Deploy AgentRegistry
    const AgentRegistryFactory = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistryFactory.deploy(admin.address);
    await agentRegistry.waitForDeployment();

    // 2. Deploy PolicyManager
    const PolicyManagerFactory = await ethers.getContractFactory("PolicyManager");
    policyManager = await PolicyManagerFactory.deploy(admin.address);
    await policyManager.waitForDeployment();

    // 3. Deploy ActionLedger
    const ActionLedgerFactory = await ethers.getContractFactory("ActionLedger");
    actionLedger = await ActionLedgerFactory.deploy(
      admin.address,
      await agentRegistry.getAddress(),
      await policyManager.getAddress()
    );
    await actionLedger.waitForDeployment();

    // 4. Deploy RewardVault
    const RewardVaultFactory = await ethers.getContractFactory("RewardVault");
    rewardVault = await RewardVaultFactory.deploy(admin.address);
    await rewardVault.waitForDeployment();

    // Grant LEDGER_ROLE on PolicyManager to ActionLedger
    const LEDGER_ROLE = await policyManager.LEDGER_ROLE();
    await policyManager.grantRole(LEDGER_ROLE, await actionLedger.getAddress());

    // Setup Roles & Constants
    AGENT_ROLE = await agentRegistry.AGENT_ROLE();
    OPERATOR_ROLE = await agentRegistry.OPERATOR_ROLE();
    REWARD_ISSUANCE_OP = ethers.keccak256(ethers.toUtf8Bytes("REWARD_ISSUANCE"));

    // Register agentSigner in AgentRegistry
    await agentRegistry.registerAgent(
      agentSigner.address,
      AGENT_ROLE,
      "Test Agent Alpha",
      "ipfs://test-agent-alpha"
    );

    // Setup REWARD_ISSUANCE policy
    // Max 50 ETH/tokens, 0 cooldown for test, requires approval, targets restricted
    await policyManager.setPolicy(
      REWARD_ISSUANCE_OP,
      ethers.parseEther("50"),
      0, // 0s cooldown for test
      true,
      true,
      true,
      "Reward issuance policy"
    );

    // Whitelist RewardVault
    await policyManager.setTargetWhitelist(
      REWARD_ISSUANCE_OP,
      await rewardVault.getAddress(),
      true
    );
  });

  describe("AgentRegistry", function () {
    it("should correctly register an agent with valid role and metadata", async function () {
      const isRegistered = await agentRegistry.isAgentActive(agentSigner.address);
      expect(isRegistered).to.be.true;

      const agent = await agentRegistry.getAgent(agentSigner.address);
      expect(agent.name).to.equal("Test Agent Alpha");
      expect(agent.role).to.equal(AGENT_ROLE);
      expect(agent.isActive).to.be.true;
    });

    it("should revert if an unregistered address or non-operator attempts to register", async function () {
      await expect(
        agentRegistry.connect(attacker).registerAgent(
          attacker.address,
          AGENT_ROLE,
          "Rogue Agent",
          ""
        )
      ).to.be.revertedWithCustomError(agentRegistry, "AccessControlUnauthorizedAccount");
    });

    it("should allow operator to deactivate and reactivate an agent", async function () {
      await agentRegistry.setAgentStatus(agentSigner.address, false);
      expect(await agentRegistry.isAgentActive(agentSigner.address)).to.be.false;

      await agentRegistry.setAgentStatus(agentSigner.address, true);
      expect(await agentRegistry.isAgentActive(agentSigner.address)).to.be.true;
    });

    it("should prevent duplicate registration of the same agent address", async function () {
      await expect(
        agentRegistry.registerAgent(
          agentSigner.address,
          AGENT_ROLE,
          "Duplicate Agent",
          ""
        )
      ).to.be.revertedWithCustomError(agentRegistry, "AgentAlreadyExists");
    });
  });

  describe("PolicyManager", function () {
    it("should validate an action that complies with policy limits", async function () {
      const rewardVaultAddr = await rewardVault.getAddress();
      const amount = ethers.parseEther("10");

      const [isValid, reason] = await policyManager.validateAction(
        REWARD_ISSUANCE_OP,
        rewardVaultAddr,
        amount
      );
      expect(isValid).to.be.true;
      expect(reason).to.include("Validated successfully");
    });

    it("should reject an action exceeding the maximum allowed amount", async function () {
      const rewardVaultAddr = await rewardVault.getAddress();
      const excessiveAmount = ethers.parseEther("100"); // Limit is 50

      const [isValid, reason] = await policyManager.validateAction(
        REWARD_ISSUANCE_OP,
        rewardVaultAddr,
        excessiveAmount
      );
      expect(isValid).to.be.false;
      expect(reason).to.include("exceeds maximum allowed threshold");
    });

    it("should reject an unwhitelisted target when targets are restricted", async function () {
      const [isValid, reason] = await policyManager.validateAction(
        REWARD_ISSUANCE_OP,
        attacker.address,
        ethers.parseEther("5")
      );
      expect(isValid).to.be.false;
      expect(reason).to.include("not in approved whitelist");
    });

    it("should increment policy version upon update", async function () {
      const initialPolicy = await policyManager.getPolicy(REWARD_ISSUANCE_OP);
      expect(initialPolicy.version).to.equal(1n);

      await policyManager.setPolicy(
        REWARD_ISSUANCE_OP,
        ethers.parseEther("60"),
        0,
        true,
        true,
        true,
        "Updated Policy"
      );

      const updatedPolicy = await policyManager.getPolicy(REWARD_ISSUANCE_OP);
      expect(updatedPolicy.version).to.equal(2n);
      expect(updatedPolicy.maxAmount).to.equal(ethers.parseEther("60"));
    });
  });

  describe("ActionLedger & Execution Flow", function () {
    let actionId, callData, targetAddress;

    beforeEach(async function () {
      actionId = ethers.keccak256(ethers.toUtf8Bytes("ACTION-PROPOSAL-001"));
      targetAddress = await rewardVault.getAddress();

      // Encode reward distribution call: distributeReward(recipient, amount, actionId)
      const iface = new ethers.Interface([
        "function distributeReward(address recipient, uint256 amount, bytes32 actionId) external returns (bool)",
      ]);
      callData = iface.encodeFunctionData("distributeReward", [
        userSigner.address,
        ethers.parseEther("10"),
        actionId,
      ]);
    });

    it("should allow an authorized active agent to submit a valid action proposal", async function () {
      await expect(
        actionLedger
          .connect(agentSigner)
          .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData)
      )
        .to.emit(actionLedger, "ActionProposed")
        .withArgs(
          actionId,
          anyValue,
          REWARD_ISSUANCE_OP,
          agentSigner.address,
          targetAddress,
          0,
          callData,
          anyValue
        );

      const action = await actionLedger.getAction(actionId);
      expect(action.agent).to.equal(agentSigner.address);
      expect(action.status).to.equal(1n); // Proposed
    });

    it("should reject proposal if agent is inactive or unregistered", async function () {
      const newActionId = ethers.keccak256(ethers.toUtf8Bytes("ACTION-ATTACK-001"));
      await expect(
        actionLedger
          .connect(attacker)
          .proposeAction(newActionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData)
      ).to.be.revertedWithCustomError(actionLedger, "InactiveAgent");
    });

    it("should prevent duplicate proposal with the same actionId", async function () {
      await actionLedger
        .connect(agentSigner)
        .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData);

      await expect(
        actionLedger
          .connect(agentSigner)
          .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData)
      ).to.be.revertedWithCustomError(actionLedger, "ActionAlreadyExists");
    });

    it("should execute proposal upon user approval and perform state change in target vault", async function () {
      // 1. Agent proposes
      await actionLedger
        .connect(agentSigner)
        .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData);

      // 2. User approves and executes
      await expect(
        actionLedger.connect(userSigner).approveAndExecuteAction(actionId)
      )
        .to.emit(actionLedger, "ActionApproved")
        .and.to.emit(actionLedger, "ActionExecuted")
        .and.to.emit(rewardVault, "RewardDistributed");

      // Verify action ledger status updated to Executed (status = 3)
      const action = await actionLedger.getAction(actionId);
      expect(action.status).to.equal(3n); // Executed
      expect(action.approvedBy).to.equal(userSigner.address);

      // Verify RewardVault state changed
      const recipientReward = await rewardVault.userRewards(userSigner.address);
      expect(recipientReward).to.equal(ethers.parseEther("10"));
    });

    it("should prevent duplicate execution of an already executed action", async function () {
      await actionLedger
        .connect(agentSigner)
        .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData);

      await actionLedger.connect(userSigner).approveAndExecuteAction(actionId);

      // Attempt second execution
      await expect(
        actionLedger.connect(userSigner).approveAndExecuteAction(actionId)
      ).to.be.revertedWithCustomError(actionLedger, "InvalidActionStatus");
    });

    it("should allow an authorized user to reject a proposal with a reason", async function () {
      await actionLedger
        .connect(agentSigner)
        .proposeAction(actionId, REWARD_ISSUANCE_OP, targetAddress, 0, callData);

      await expect(
        actionLedger
          .connect(userSigner)
          .rejectAction(actionId, "Requested reward amount does not match performance metric")
      )
        .to.emit(actionLedger, "ActionRejected")
        .withArgs(
          actionId,
          userSigner.address,
          "Requested reward amount does not match performance metric",
          anyValue
        );

      const action = await actionLedger.getAction(actionId);
      expect(action.status).to.equal(4n); // Rejected
      expect(action.rejectionReason).to.equal(
        "Requested reward amount does not match performance metric"
      );
    });
  });
});

