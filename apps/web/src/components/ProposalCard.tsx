import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

interface ProposalCardProps {
  proposal: any;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onExecute: (id: string, txHash: string, blockNumber: number, gasUsed: string) => Promise<void>;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onApprove,
  onReject,
  onExecute,
}) => {
  const { approveAndExecuteOnChain, isConnected } = useWeb3();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'POLICY_VIOLATED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            <span>Policy Violated</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'EXECUTED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Executed On-Chain</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/40">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score < 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const handleExecuteWithWallet = async () => {
    if (!isConnected) {
      alert('Please connect your Web3 wallet first to execute on-chain.');
      return;
    }

    setIsExecuting(true);
    try {
      // 1. Submit on-chain approval and execution to ActionLedger contract
      const receipt = await approveAndExecuteOnChain(proposal.action_id as `0x${string}`);
      // 2. Notify API of confirmed execution receipt
      await onExecute(proposal.id, receipt.hash, receipt.blockNumber, receipt.gasUsed);
    } catch (err: any) {
      console.error('On-chain execution failed:', err);
      alert(`On-chain execution failed: ${err.message || err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-[#0e1424] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
            {proposal.operation_type}
          </span>
          <h3 className="font-semibold text-base text-slate-100">{proposal.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {/* Risk score */}
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${getRiskColor(
              proposal.policy_result.risk_score
            )}`}
          >
            <Flame className="w-3 h-3" />
            <span>Risk {proposal.policy_result.risk_score}/100</span>
          </span>
          {getStatusBadge(proposal.status)}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">{proposal.description}</p>

      {/* Policy Evaluation Overview */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Independent Policy Validation:</span>
          {proposal.policy_result.is_allowed ? (
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Complies with Security Rules</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-rose-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Rule Violation</span>
            </span>
          )}
        </div>

        {/* Violations if any */}
        {proposal.policy_result.violations?.length > 0 && (
          <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-lg p-2 space-y-1">
            {proposal.policy_result.violations.map((v: string, idx: number) => (
              <div key={idx} className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reasons */}
        {proposal.policy_result.reasons?.length > 0 && (
          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
            {proposal.policy_result.reasons.map((r: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="text-cyan-400">✓</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Technical Details */}
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide Payload & Cryptographic Proof' : 'View Payload & Cryptographic Proof'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Action ID:</span>
              <span className="text-slate-300">{proposal.action_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proposal Hash (keccak256):</span>
              <span className="text-cyan-400">{proposal.proposal_hash.slice(0, 20)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Contract:</span>
              <span className="text-indigo-400">{proposal.target_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Value (Wei):</span>
              <span className="text-slate-300">{proposal.value_wei}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Encoded CallData:</span>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] break-all text-slate-400">
                {proposal.call_data}
              </div>
            </div>

            {/* Execution receipt if executed */}
            {proposal.execution && (
              <div className="pt-2 border-t border-slate-800 space-y-1 text-emerald-400">
                <div className="flex justify-between">
                  <span>Tx Hash:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${proposal.execution.transaction_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 underline hover:text-emerald-300"
                  >
                    <span>{proposal.execution.transaction_hash.slice(0, 16)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Block Height: #{proposal.execution.block_number}</span>
                  <span>Gas: {proposal.execution.gas_used}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-500 font-mono">
          Proposed by: {proposal.agent_address?.slice(0, 8)}...
        </div>

        <div className="flex items-center space-x-2">
          {/* Reject button for pending proposals */}
          {proposal.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 transition-colors"
            >
              Reject
            </button>
          )}

          {/* Approve Off-Chain */}
          {proposal.status === 'PENDING_APPROVAL' && proposal.policy_result.is_allowed && (
            <button
              onClick={() => onApprove(proposal.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Approve Only
            </button>
          )}

          {/* Authorize & Execute via Smart Contract */}
          {(proposal.status === 'PENDING_APPROVAL' || proposal.status === 'APPROVED') &&
            proposal.policy_result.is_allowed && (
              <button
                onClick={handleExecuteWithWallet}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-cyan transition-all disabled:opacity-50"
              >
                <span>{isExecuting ? 'Submitting to EVM...' : 'Approve & Execute via Wallet'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-semibold text-base text-slate-100">Reject Action Proposal</h4>
            <p className="text-xs text-slate-400">
              Please specify the audit reason for rejecting this AI proposal. This reason will be recorded on the audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Requested amount exceeds current sprint budget allocation"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 h-24 resize-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(proposal.id, rejectReason);
                  setShowRejectModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
