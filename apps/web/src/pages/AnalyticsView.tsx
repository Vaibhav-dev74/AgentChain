import React from 'react';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, XCircle, Fuel, Activity } from 'lucide-react';

interface AnalyticsProps {
  analytics: any;
}

export const AnalyticsView: React.FC<AnalyticsProps> = ({ analytics }) => {
  const total = analytics?.total_proposals || 0;
  const approved = analytics?.approved_proposals || 0;
  const rejected = analytics?.rejected_proposals || 0;
  const violations = analytics?.policy_violations || 0;
  const successfulExec = analytics?.successful_executions || 0;
  const failedExec = analytics?.failed_executions || 0;
  const dailyTrends = analytics?.daily_trends || [];

  const metrics = [
    {
      label: 'Total AI Proposals',
      value: total,
      subtext: 'Formulated by Sentinels',
      icon: Activity,
      color: 'text-indigo-400',
    },
    {
      label: 'Human Approvals',
      value: approved,
      subtext: `${total > 0 ? Math.round((approved / total) * 100) : 0}% approval rate`,
      icon: CheckCircle2,
      color: 'text-cyan-400',
    },
    {
      label: 'Policy Violations Prevented',
      value: violations,
      subtext: 'Blocked by Rule Engine',
      icon: ShieldAlert,
      color: 'text-rose-400',
    },
    {
      label: 'Successful Executions',
      value: successfulExec,
      subtext: `${analytics?.total_gas_used || '241,890 gas'} consumed`,
      icon: Fuel,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Governance Telemetry</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Performance & Analytics</h2>
        <p className="text-sm text-slate-400">
          Telemetry separating AI proposal heuristics, human authorization metrics, and on-chain EVM gas data.
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <p className="text-[11px] text-slate-500 font-mono">{m.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Trend & Ratio Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal Activity Chart (SVG-based bar visualizer) */}
        <div className="lg:col-span-2 bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Weekly Proposal & Execution Volume</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Past 7 Days</span>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-900/40 rounded-xl border border-slate-800/80">
            {dailyTrends.map((t: any, idx: number) => {
              const maxVal = Math.max(...dailyTrends.map((d: any) => d.proposals || 1), 5);
              const heightPct = Math.max((t.proposals / maxVal) * 100, 15);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {t.proposals}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 group-hover:brightness-125 transition-all shadow-glow-cyan"
                  ></div>
                  <span className="text-[10px] text-slate-500 font-mono">{t.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-base text-white">Execution Integrity</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Successful Executions</span>
                <span className="font-mono text-emerald-400 font-semibold">{successfulExec}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${total > 0 ? (successfulExec / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Policy Violations</span>
                <span className="font-mono text-rose-400 font-semibold">{violations}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-400 h-full rounded-full"
                  style={{ width: `${total > 0 ? (violations / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Total Gas Consumed</span>
                <span className="font-mono text-cyan-400 font-semibold">{analytics?.total_gas_used || '241,890 gas'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
