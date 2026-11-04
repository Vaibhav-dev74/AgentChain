import React from 'react';
import { Settings, Shield, Wallet, Link, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../lib/contracts';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { address, chainId, balance, connectWallet, switchNetwork } = useWeb3();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Platform & Network Settings</h2>
        <p className="text-sm text-slate-400">
          Environment parameters, smart contract addresses, and connected authentication state.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center space-x-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Operator Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[11px] font-sans">Username</span>
            <span className="text-white font-semibold">{user?.username || 'Guest'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[11px] font-sans">Assigned Role</span>
            <span className="text-cyan-400 font-semibold">{user?.role || 'UNAUTHENTICATED'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-2 truncate">
            <span className="text-slate-500 block text-[11px] font-sans">Primary Wallet Address</span>
            <span className="text-slate-300">{user?.wallet_address || 'Not linked to user account'}</span>
          </div>
        </div>
      </div>

      {/* Web3 Network Settings */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span>Web3 Connection & RPC</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[11px] font-sans">Current Chain ID</span>
            <span className="text-white font-semibold">{chainId || 31337}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block text-[11px] font-sans">Wallet Balance</span>
            <span className="text-cyan-400 font-semibold">{balance} ETH</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => switchNetwork(11155111)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Switch to Sepolia (11155111)
          </button>
          <button
            onClick={() => switchNetwork(31337)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Switch to Local Hardhat (31337)
          </button>
        </div>
      </div>

      {/* Smart Contract Registry */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center space-x-2">
          <Link className="w-4 h-4 text-cyan-400" />
          <span>Deployed Smart Contracts Manifest</span>
        </h3>

        <div className="space-y-2.5 text-xs font-mono">
          {Object.entries(CONTRACT_ADDRESSES).map(([name, addr]) => (
            <div
              key={name}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
            >
              <span className="text-slate-400 font-sans font-medium">{name}</span>
              <span className="text-cyan-300 truncate max-w-[280px] sm:max-w-none">{addr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
