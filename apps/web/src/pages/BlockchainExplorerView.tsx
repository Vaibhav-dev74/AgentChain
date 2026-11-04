import React from 'react';
import { Compass, ExternalLink, ShieldCheck, Box, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

interface ExplorerProps {
  explorerData: any;
}

export const BlockchainExplorerView: React.FC<ExplorerProps> = ({ explorerData }) => {
  const { address, chainId, balance } = useWeb3();

  const getExplorerBaseUrl = (id?: number) => {
    if (id === 11155111) return 'https://sepolia.etherscan.io';
    return 'http://127.0.0.1:8545';
  };

  const contracts = explorerData?.contracts || [];
  const transactions = explorerData?.recent_transactions || [];
  const events = explorerData?.recent_events || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Real-time On-Chain Explorer</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">EVM Telemetry & Event Ledger</h2>
        <p className="text-sm text-slate-400">
          Inspect deployed smart contracts, verified transactions, block heights, and indexed smart contract events.
        </p>
      </div>

      {/* Network & Connected Signer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Network Environment</span>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{explorerData?.network_name || 'AgentChain Local EVM'}</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Chain ID: {explorerData?.chain_id || 31337}</p>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Latest Scanned Block</span>
          <div className="text-lg font-bold text-cyan-400 font-mono">
            #{explorerData?.latest_block || 1024}
          </div>
          <p className="text-xs text-slate-400">Synchronized with RPC node</p>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Active Operator Wallet</span>
          <div className="text-sm font-bold text-slate-200 font-mono truncate">
            {address || 'Wallet not connected'}
          </div>
          <p className="text-xs text-emerald-400 font-mono">{balance} ETH</p>
        </div>
      </div>

      {/* Deployed Smart Contracts */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-base text-white mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Core Governance Contracts</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((c: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-white block">{c.name}</span>
                <span className="font-mono text-xs text-slate-400">{c.address}</span>
              </div>
              <a
                href={`${getExplorerBaseUrl(c.chain_id)}/address/${c.address}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                title="View on Block Explorer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Recent On-Chain Transactions */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-base text-white mb-4 flex items-center space-x-2">
          <Box className="w-4 h-4 text-indigo-400" />
          <span>Recent Blockchain Transactions</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                <th className="py-2.5 px-3">Tx Hash</th>
                <th className="py-2.5 px-3">Block</th>
                <th className="py-2.5 px-3">From</th>
                <th className="py-2.5 px-3">To (Target)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Gas Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 text-cyan-400 font-semibold truncate max-w-[140px]">
                    <a
                      href={`${getExplorerBaseUrl(chainId || 31337)}/tx/${tx.transaction_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center space-x-1"
                    >
                      <span>{tx.transaction_hash.slice(0, 14)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">#{tx.block_number}</td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">{tx.from_address.slice(0, 10)}...</td>
                  <td className="py-2.5 px-3 text-indigo-400 truncate max-w-[120px]">{tx.to_address.slice(0, 10)}...</td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{tx.gas_used}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-sans">
                    No transactions indexed yet. Execute an approved proposal to generate live on-chain transactions!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
