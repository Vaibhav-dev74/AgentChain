import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bot,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

interface OverviewProps {
  analytics: any;
  proposals: any[];
  onNavigateToWorkspace: () => void;
  onNavigateToApprovals: () => void;
}

export const OverviewView: React.FC<OverviewProps> = ({
  analytics,
  proposals,
  onNavigateToWorkspace,
  onNavigateToApprovals,
}) => {
  const pendingCount = proposals.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const executedCount = analytics?.successful_executions || 0;
  const totalCount = analytics?.total_proposals || proposals.length;
  const activeAgents = analytics?.active_agents_count || 1;

  const statCards = [
    {
      label: 'Total Proposals',
      value: totalCount,
      change: '+12% this week',
      icon: FileText,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Pending Approvals',
      value: pendingCount,
      change: `${pendingCount} awaiting authorization`,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Executed On-Chain',
      value: executedCount,
      change: '100% verified',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Active AI Sentinels',
      value: activeAgents,
      change: 'Registered on-chain',
      icon: Bot,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI + Smart Contract Orchestration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Autonomous Planning, <span className="text-cyan-400">Verifiable Execution.</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            AI agents formulate structured action proposals, validate them against mathematical on-chain governance policies, and await your cryptographic wallet approval before executing.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onNavigateToWorkspace}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-cyan transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Workspace</span>
            </button>
            {pendingCount > 0 && (
              <button
                onClick={onNavigateToApprovals}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
              >
                <span>Review {pendingCount} Pending Actions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Proposals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-2 bg-[#0e1424] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Recent Governance Proposals</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live feed</span>
          </div>

          <div className="space-y-3">
            {proposals.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-200 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{p.action_id.slice(0, 16)}...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {p.operation_type}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'EXECUTED'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : p.status === 'PENDING_APPROVAL'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-400 bg-slate-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}

            {proposals.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                No action proposals generated yet. Visit the AI Agent Workspace to formulate one!
              </div>
            )}
          </div>
        </div>

        {/* Right: Security & Network Telemetry */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-base text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Contract Security Posture</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Human-in-the-Loop Gateway</span>
              <span className="text-emerald-400 font-medium">Enforced for Consequential Operations</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">On-Chain Policy Engine</span>
              <span className="text-cyan-400 font-medium">PolicyManager.sol Active (Version 1)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Replay & Duplicate Protection</span>
              <span className="text-indigo-400 font-medium">Cryptographic keccak256 ActionIDs</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Target Execution Contract</span>
              <span className="text-slate-200 font-mono text-[11px]">RewardVault.sol (Verified)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

