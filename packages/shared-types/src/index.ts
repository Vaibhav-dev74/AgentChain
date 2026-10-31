/**
 * AgentChain AI - Shared TypeScript Definitions
 */

export type OperationType =
  | 'REWARD_ISSUANCE'
  | 'TOKEN_TRANSFER'
  | 'POLICY_UPDATE'
  | 'AGENT_REGISTER'
  | 'AGENT_DEACTIVATE'
  | 'CONTRACT_CALL';

export type ProposalStatus =
  | 'PENDING_POLICY_CHECK'
  | 'POLICY_VIOLATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'EXECUTION_FAILED';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  walletAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRecord {
  id: string;
  name: string;
  agentAddress: string;
  role: string;
  description: string;
  isActive: boolean;
  registeredBy: string;
  registeredAt: string;
  lastActiveAt?: string | null;
}

export interface PolicyRule {
  id: string;
  name: string;
  operationType: OperationType;
  maxAmount: string; // BigNumber string or decimal string
  allowedTargets: string[]; // Whitelisted target addresses (empty means unrestricted)
  requireUserApproval: boolean;
  requiredRole: UserRole;
  cooldownPeriodSeconds: number;
  isActive: boolean;
  version: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyCheckResult {
  isAllowed: boolean;
  policyId?: string;
  violations: string[];
  reasons: string[];
  riskScore: number; // 0 to 100
  evaluatedAt: string;
}

export interface ActionProposal {
  id: string;
  actionId: string; // 32-byte hex string (bytes32 for Solidity)
  title: string;
  description: string;
  operationType: OperationType;
  agentId: string;
  agentAddress: string;
  targetAddress: string;
  callData: string;
  valueWei: string;
  proposalHash: string; // keccak256 hash
  status: ProposalStatus;
  policyResult: PolicyCheckResult;
  proposedByUserId: string;
  approvalDetails?: {
    approvedByWallet?: string;
    approvedAt?: string;
    signature?: string;
    rejectionReason?: string;
  };
  executionReceipt?: {
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    executedAt?: string;
    errorMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlockchainEventRecord {
  id: string;
  eventName: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  parameters: Record<string, unknown>;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  successfulExecutions: number;
  failedExecutions: number;
  policyViolations: number;
  activeAgentsCount: number;
  totalGasUsed: string;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    status: string;
    txHash?: string;
  }>;
  dailyTrends: Array<{
    date: string;
    proposals: number;
    executions: number;
  }>;
}
