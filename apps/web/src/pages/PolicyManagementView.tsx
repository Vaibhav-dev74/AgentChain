import React, { useState } from 'react';
import { ShieldAlert, Plus, CheckCircle2, History, AlertCircle, Edit2 } from 'lucide-react';
import { api } from '../lib/api';

interface PolicyManagementProps {
  policies: any[];
  onRefreshPolicies: () => void;
}

export const PolicyManagementView: React.FC<PolicyManagementProps> = ({
  policies,
  onRefreshPolicies,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [opType, setOpType] = useState('REWARD_ISSUANCE');
  const [maxAmount, setMaxAmount] = useState(50);
  const [allowedTargets, setAllowedTargets] = useState('');
  const [requiredRole, setRequiredRole] = useState('OPERATOR');
  const [cooldown, setCooldown] = useState(10);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPolicy({
        name,
        operation_type: opType,
        max_amount: Number(maxAmount),
        allowed_targets: allowedTargets || '*',
        require_user_approval: true,
        required_role: requiredRole,
        cooldown_period_seconds: Number(cooldown),
        is_active: true,
        description,
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      onRefreshPolicies();
    } catch (err: any) {
      alert(`Failed to create policy: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Policy Management & Rules Engine</h2>
          <p className="text-sm text-slate-400">
            Define mathematical risk bounds, maximum transaction limits, and address whitelists enforced on-chain.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-cyan transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Governance Rule</span>
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {policies.map((p) => (
          <div
            key={p.id}
            className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                  {p.operation_type}
                </span>
                <h3 className="font-semibold text-base text-white mt-1.5">{p.name}</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                v{p.version}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{p.description || 'Configured governance rule.'}</p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Maximum Amount</span>
                <span className="font-semibold text-white">{p.max_amount} Tokens / ETH</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Required Role</span>
                <span className="font-semibold text-indigo-400 font-mono">{p.required_role}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Cooldown Period</span>
                <span className="font-semibold text-slate-300">{p.cooldown_period_seconds} seconds</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Approval Required</span>
                <span className="font-semibold text-emerald-400">Yes (Strict)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px] truncate">
                Target Whitelist: {p.allowed_targets === '*' ? 'Unrestricted (*)' : p.allowed_targets ? `${p.allowed_targets.slice(0, 14)}...` : 'None'}
              </span>
              <span className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Create New Governance Rule</h3>
            <form onSubmit={handleCreatePolicy} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Treasury Reward Limit"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Operation Type</label>
                  <select
                    value={opType}
                    onChange={(e) => setOpType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="REWARD_ISSUANCE">REWARD_ISSUANCE</option>
                    <option value="TOKEN_TRANSFER">TOKEN_TRANSFER</option>
                    <option value="POLICY_UPDATE">POLICY_UPDATE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Amount</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Allowed Target Address (or * for unrestricted)</label>
                <input
                  type="text"
                  value={allowedTargets}
                  onChange={(e) => setAllowedTargets(e.target.value)}
                  placeholder="0x... or *"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Policy explanation and constraints..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Deploy Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
