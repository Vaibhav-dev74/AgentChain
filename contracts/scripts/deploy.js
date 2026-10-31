const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying AgentChain Contracts with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("----------------------------------------------------");

  // 1. Deploy AgentRegistry
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(deployer.address);
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✓ AgentRegistry deployed to:", agentRegistryAddress);

  // 2. Deploy PolicyManager
  const PolicyManager = await hre.ethers.getContractFactory("PolicyManager");
  const policyManager = await PolicyManager.deploy(deployer.address);
  await policyManager.waitForDeployment();
  const policyManagerAddress = await policyManager.getAddress();
  console.log("✓ PolicyManager deployed to:", policyManagerAddress);

  // 3. Deploy ActionLedger
  const ActionLedger = await hre.ethers.getContractFactory("ActionLedger");
  const actionLedger = await ActionLedger.deploy(
    deployer.address,
    agentRegistryAddress,
    policyManagerAddress
  );
  await actionLedger.waitForDeployment();
  const actionLedgerAddress = await actionLedger.getAddress();
  console.log("✓ ActionLedger deployed to:", actionLedgerAddress);

  // 4. Deploy RewardVault (target execution contract)
  const RewardVault = await hre.ethers.getContractFactory("RewardVault");
  const rewardVault = await RewardVault.deploy(deployer.address);
  await rewardVault.waitForDeployment();
  const rewardVaultAddress = await rewardVault.getAddress();
  console.log("✓ RewardVault deployed to:", rewardVaultAddress);

  // 5. Grant LEDGER_ROLE on PolicyManager to ActionLedger
  const LEDGER_ROLE = await policyManager.LEDGER_ROLE();
  const grantTx = await policyManager.grantRole(LEDGER_ROLE, actionLedgerAddress);
  await grantTx.wait();
  console.log("✓ Granted LEDGER_ROLE to ActionLedger");

  // 6. Configure Initial Policy for REWARD_ISSUANCE
  const REWARD_ISSUANCE_OP = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("REWARD_ISSUANCE"));
  // 100 max tokens/ETH, 10 seconds cooldown, user approval required, target restricted = true
  const maxAmount = hre.ethers.parseEther("100");
  const cooldownSeconds = 10;
  const policyTx = await policyManager.setPolicy(
    REWARD_ISSUANCE_OP,
    maxAmount,
    cooldownSeconds,
    true, // requireUserApproval
    true, // restrictTargets
    true, // isActive
    "Default policy for AI-initiated reward issuances"
  );
  await policyTx.wait();
  console.log("✓ Configured initial policy for REWARD_ISSUANCE");

  // Whitelist RewardVault for REWARD_ISSUANCE
  const whitelistTx = await policyManager.setTargetWhitelist(
    REWARD_ISSUANCE_OP,
    rewardVaultAddress,
    true
  );
  await whitelistTx.wait();
  console.log("✓ Whitelisted RewardVault as valid target for REWARD_ISSUANCE");

  // Register Deployer as initial test Agent for testing flow
  const AGENT_ROLE = await agentRegistry.AGENT_ROLE();
  const regTx = await agentRegistry.registerAgent(
    deployer.address,
    AGENT_ROLE,
    "Genesis Sentinel Agent",
    "ipfs://agent-chain-genesis-agent"
  );
  await regTx.wait();
  console.log("✓ Registered Genesis Sentinel Agent (address:", deployer.address, ")");

  const deployedInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      AgentRegistry: agentRegistryAddress,
      PolicyManager: policyManagerAddress,
      ActionLedger: actionLedgerAddress,
      RewardVault: rewardVaultAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployed-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedInfo, null, 2));
  console.log("✓ Deployed contracts manifest saved to:", outputPath);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

