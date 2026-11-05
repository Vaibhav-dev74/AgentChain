import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { OverviewView } from './pages/OverviewView';
import { AIWorkspaceView } from './pages/AIWorkspaceView';
import { ProposalsView } from './pages/ProposalsView';
import { ApprovalCenterView } from './pages/ApprovalCenterView';
import { PolicyManagementView } from './pages/PolicyManagementView';
import { BlockchainExplorerView } from './pages/BlockchainExplorerView';
import { TransactionHistoryView } from './pages/TransactionHistoryView';
import { AnalyticsView } from './pages/AnalyticsView';
import { AgentManagementView } from './pages/AgentManagementView';
import { SettingsView } from './pages/SettingsView';
import { api } from './lib/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Core Data States
  const [proposals, setProposals] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [explorerData, setExplorerData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = async () => {
    try {
      const [props, pols, ags, ana, exp] = await Promise.all([
        api.getProposals().catch(() => []),
        api.getPolicies().catch(() => []),
        api.getAgents().catch(() => []),
        api.getAnalyticsDashboard().catch(() => null),
        api.getExplorerOverview().catch(() => null),
      ]);
      setProposals(props);
      setPolicies(pols);
      setAgents(ags);
      setAnalytics(ana);
      setExplorerData(exp);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleGenerateProposal = async (prompt: string, agentId?: string) => {
    const newProposal = await api.createProposalFromPrompt(prompt, agentId);
    await refreshData();
    return newProposal;
  };

  const handleApproveProposal = async (id: string) => {
    await api.reviewProposal(id, { action: 'APPROVE' });
    await refreshData();
  };

  const handleRejectProposal = async (id: string, reason: string) => {
    await api.reviewProposal(id, { action: 'REJECT', rejection_reason: reason });
    await refreshData();
  };

  const handleExecuteProposal = async (
    id: string,
    txHash: string,
    blockNumber: number,
    gasUsed: string
  ) => {
    await api.recordExecution(id, {
      transaction_hash: txHash,
      block_number: blockNumber,
      gas_used: gasUsed,
      status: 'SUCCESS',
    });
    await refreshData();
  };

  const pendingApprovalsCount = proposals.filter((p) => p.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentTab === 'overview' && (
            <OverviewView
              analytics={analytics}
              proposals={proposals}
              onNavigateToWorkspace={() => setCurrentTab('ai-workspace')}
              onNavigateToApprovals={() => setCurrentTab('approval-center')}
            />
          )}

          {currentTab === 'ai-workspace' && (
            <AIWorkspaceView
              onGenerateProposal={handleGenerateProposal}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onExecute={handleExecuteProposal}
              agents={agents}
            />
          )}

          {currentTab === 'proposals' && (
            <ProposalsView
              proposals={proposals}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onExecute={handleExecuteProposal}
            />
          )}

          {currentTab === 'approval-center' && (
            <ApprovalCenterView
              proposals={proposals}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onExecute={handleExecuteProposal}
            />
          )}

          {currentTab === 'policies' && (
            <PolicyManagementView
              policies={policies}
              onRefreshPolicies={refreshData}
            />
          )}

          {currentTab === 'explorer' && (
            <BlockchainExplorerView explorerData={explorerData} />
          )}

          {currentTab === 'transactions' && (
            <TransactionHistoryView
              transactions={explorerData?.recent_transactions || []}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView analytics={analytics} />
          )}

          {currentTab === 'agents' && (
            <AgentManagementView
              agents={agents}
              onRefreshAgents={refreshData}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

