import React, { useState } from 'react';
import { Users2, Bot, Plus, ShieldCheck, ShieldAlert, Power, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

interface AgentManagementProps {
  agents: any[];
  onRefreshAgents: () => void;
}

export const AgentManagementView: React.FC<AgentManagementProps> = ({
  agents,
  onRefreshAgents,
}) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('AGENT_ROLE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.registerAgent({
        name,
        agent_address: address,
        role,
        description,
        metadata_uri: `ipfs://agentchain-${name.toLowerCase().replace(/\s+/g, '-')}`,
      });
      setShowRegisterModal(false);
      setName('');
      setAddress('');
      setDescription('');
      onRefreshAgents();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.toggleAgentStatus(id, !currentStatus);
      onRefreshAgents();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users2 className="w-4 h-4" />
            <span>Agent Registry</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Agent Sentinel Management</h2>
          <p className="text-sm text-slate-400">
            Provision, authorize, and control autonomous agents registered in the AgentRegistry.sol contract.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-cyan transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    agent.is_active
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-slate-500 bg-slate-800 border-slate-700'
                  }`}
                >
                  {agent.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-base text-white">{agent.name}</h3>
                <span className="font-mono text-[11px] text-cyan-400 font-semibold">{agent.role}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {agent.description || 'Authorized AI agent for on-chain task planning.'}
              </p>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 truncate">
                <span className="text-slate-500 block text-[10px]">EVM Address:</span>
                <span className="truncate">{agent.agent_address}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Created {new Date(agent.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleToggleStatus(agent.id, agent.is_active)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  agent.is_active
                    ? 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
                    : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{agent.is_active ? 'Disable' : 'Enable'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Register AI Sentinel Agent</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Treasury Sentinel Beta"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agent EVM Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="AGENT_ROLE">AGENT_ROLE (Standard)</option>
                  <option value="OPERATOR_ROLE">OPERATOR_ROLE (High Privilege)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task mandate and purpose..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

