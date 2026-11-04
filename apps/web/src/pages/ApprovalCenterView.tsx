import React from 'react';
import { CheckSquare, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { ProposalCard } from '../components/ProposalCard';
import { useWeb3 } from '../context/Web3Context';

interface ApprovalCenterProps {
  proposals: any[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onExecute: (id: string, hash: string, block: number, gas: string) => Promise<void>;
}

export const ApprovalCenterView: React.FC<ApprovalCenterProps> = ({
  proposals,
  onApprove,
  onReject,
  onExecute,
}) => {
  const { isConnected, connectWallet } = useWeb3();

  // Filter for actions pending human authorization
  const pendingActions = proposals.filter((p) => p.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <CheckSquare className="w-4 h-4" />
          <span>Human-in-the-Loop Gateway</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Authorization & Approval Center</h2>
        <p className="text-sm text-slate-400">
          Review, sign, and authorize consequential actions proposed by AI sentinels before smart contracts execute on-chain.
        </p>
      </div>

      {/* Wallet Connection Status Alert if not connected */}
      {!isConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connect your Web3 wallet (MetaMask) to sign and execute approved transactions on-chain.</span>
          </div>
          <button
            onClick={connectWallet}
            className="px-3.5 py-1.5 rounded-xl font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Pending Action Cards */}
      <div className="space-y-4">
        {pendingActions.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onApprove={onApprove}
            onReject={onReject}
            onExecute={onExecute}
          />
        ))}

        {pendingActions.length === 0 && (
          <div className="text-center py-16 bg-[#0e1424] border border-slate-800 rounded-3xl space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">All Clear! No Pending Approvals</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are currently no proposals awaiting human authorization. When an AI agent formulates an action, it will appear here for review and cryptographic signature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
