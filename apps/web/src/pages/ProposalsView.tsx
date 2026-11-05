import React, { useState } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import { ProposalCard } from '../components/ProposalCard';

interface ProposalsViewProps {
  proposals: any[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onExecute: (id: string, hash: string, block: number, gas: string) => Promise<void>;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  onApprove,
  onReject,
  onExecute,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = proposals.filter((p) => {
    const matchesFilter = filter === 'ALL' || p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.action_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.operation_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Proposals' },
    { id: 'PENDING_APPROVAL', label: 'Pending Review' },
    { id: 'POLICY_VIOLATED', label: 'Policy Violated' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'EXECUTED', label: 'Executed' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Action Proposals Ledger</h2>
        <p className="text-sm text-slate-400">
          Complete verifiable record of all AI-generated proposals, policy evaluations, and authorization states.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === tab.id
                  ? 'bg-indigo-600/30 text-cyan-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action ID, title..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Proposal Cards List */}
      <div className="space-y-4">
        {filtered.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onApprove={onApprove}
            onReject={onReject}
            onExecute={onExecute}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-[#0e1424] border border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No proposals found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? 'No proposals match your search query.' : 'No proposals in this category yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

