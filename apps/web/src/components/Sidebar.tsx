import React from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  CheckSquare,
  ShieldAlert,
  Compass,
  History,
  BarChart3,
  Users2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'ai-workspace'
  | 'proposals'
  | 'approval-center'
  | 'policies'
  | 'explorer'
  | 'transactions'
  | 'analytics'
  | 'agents'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingApprovalsCount = 0,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'ai-workspace' as NavTab, label: 'AI Agent Workspace', icon: Bot, highlight: true },
    { id: 'proposals' as NavTab, label: 'Action Proposals', icon: FileText },
    {
      id: 'approval-center' as NavTab,
      label: 'Approval Center',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'policies' as NavTab, label: 'Policy Management', icon: ShieldAlert },
    { id: 'explorer' as NavTab, label: 'Blockchain Explorer', icon: Compass },
    { id: 'transactions' as NavTab, label: 'Transaction History', icon: History },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'agents' as NavTab, label: 'Agent Management', icon: Users2 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-[calc(100vh-4rem)] bg-[#090d16]/95 border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
              } py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : item.highlight ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-[11px] text-slate-500 font-mono">v1.0.0 • Hardhat EVM</div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

