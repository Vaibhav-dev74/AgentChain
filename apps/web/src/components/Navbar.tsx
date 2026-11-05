import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { ShieldCheck, Wallet, LogOut, User, Activity, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { address, isConnected, isConnecting, balance, chainId, connectWallet, disconnectWallet } = useWeb3();

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getNetworkName = (id: number | null) => {
    if (id === 11155111) return 'Sepolia Testnet';
    if (id === 31337) return 'Local Hardhat EVM';
    if (id) return `Chain ID ${id}`;
    return 'EVM Network';
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Platform Identifier */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow-indigo">
          <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AgentChain <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
              Verifiable
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">AI Automation & Smart Contract Governance</p>
        </div>
      </div>

      {/* Right Controls: Web3 Wallet & User Authentication */}
      <div className="flex items-center space-x-3">
        {/* Network Badge */}
        {isConnected && (
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{getNetworkName(chainId)}</span>
          </div>
        )}

        {/* Web3 Wallet Button */}
        {isConnected && address ? (
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 pr-3 space-x-2">
            <span className="text-xs font-mono font-medium px-2 py-1 bg-slate-800/70 rounded text-cyan-300">
              {balance} ETH
            </span>
            <span className="text-xs font-mono text-slate-300">
              {truncateAddress(address)}
            </span>
            <button
              onClick={disconnectWallet}
              title="Disconnect Wallet"
              className="text-slate-400 hover:text-rose-400 transition-colors p-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        )}

        {/* User Account Button */}
        {user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-medium text-slate-200">{user.username}</span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">{user.role}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

