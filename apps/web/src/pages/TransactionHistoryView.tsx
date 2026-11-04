import React from 'react';
import { History, ExternalLink, CheckCircle2, XCircle, Code2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

interface TransactionHistoryProps {
  transactions: any[];
}

export const TransactionHistoryView: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const { chainId } = useWeb3();

  const getExplorerUrl = (txHash: string) => {
    if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`;
    return `http://127.0.0.1:8545`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>Execution Ledger</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">On-Chain Transaction History</h2>
        <p className="text-sm text-slate-400">
          Permanent verifiable record of confirmed EVM transactions originating from AgentChain action approvals.
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                <th className="py-3 px-3">Transaction Hash</th>
                <th className="py-3 px-3">Block Height</th>
                <th className="py-3 px-3">From (Signer)</th>
                <th className="py-3 px-3">Target Contract</th>
                <th className="py-3 px-3">Gas Used</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 font-semibold text-cyan-400">
                    <a
                      href={getExplorerUrl(tx.transaction_hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center space-x-1"
                    >
                      <span>{tx.transaction_hash.slice(0, 16)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 px-3 text-slate-300">#{tx.block_number}</td>
                  <td className="py-3 px-3 text-slate-400 truncate max-w-[120px]">{tx.from_address.slice(0, 10)}...</td>
                  <td className="py-3 px-3 text-indigo-400 truncate max-w-[120px]">{tx.to_address.slice(0, 10)}...</td>
                  <td className="py-3 px-3 text-slate-300">{tx.gas_used}</td>
                  <td className="py-3 px-3">
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-sans">
                    No transactions executed yet. Approve an action proposal to execute an on-chain transaction.
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
