import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom, formatEther, createPublicClient, http } from 'viem';
import { sepolia, hardhat } from 'viem/chains';
import { CONTRACT_ADDRESSES, ACTION_LEDGER_ABI } from '../lib/contracts';

interface Web3ContextType {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
  approveAndExecuteOnChain: (actionId: `0x${string}`, valueWei?: bigint) => Promise<{ hash: `0x${string}`; blockNumber: number; gasUsed: string }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const getPublicClient = () => {
    const isSepolia = chainId === 11155111;
    return createPublicClient({
      chain: isSepolia ? sepolia : hardhat,
      transport: http(isSepolia ? 'https://rpc.sepolia.org' : 'http://127.0.0.1:8545'),
    });
  };

  const updateBalance = async (addr: `0x${string}`) => {
    try {
      const publicClient = getPublicClient();
      const bal = await publicClient.getBalance({ address: addr });
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;

      eth.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          const addr = accounts[0] as `0x${string}`;
          setAddress(addr);
          updateBalance(addr);
        } else {
          setAddress(null);
          setBalance('0.00');
        }
      });

      eth.on('chainChanged', (hexChainId: string) => {
        setChainId(parseInt(hexChainId, 16));
        if (address) updateBalance(address);
      });
    }
  }, [address, chainId]);

  const connectWallet = async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or EVM-compatible wallet extension is required to connect.');
      return null;
    }

    setIsConnecting(true);
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const currentChain = await eth.request({ method: 'eth_chainId' });

      if (accounts.length > 0) {
        const addr = accounts[0] as `0x${string}`;
        const cId = parseInt(currentChain, 16);
        setAddress(addr);
        setChainId(cId);
        await updateBalance(addr);
        return addr;
      }
      return null;
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance('0.00');
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      console.error('Network switch error:', switchError);
    }
  };

  const approveAndExecuteOnChain = async (actionId: `0x${string}`, valueWei: bigint = 0n) => {
    if (!address || typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Wallet not connected');
    }

    const eth = (window as any).ethereum;
    const isSepolia = chainId === 11155111;
    const targetChain = isSepolia ? sepolia : hardhat;

    const walletClient = createWalletClient({
      chain: targetChain,
      transport: custom(eth),
    });

    const publicClient = getPublicClient();

    // Call ActionLedger.approveAndExecuteAction
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.ActionLedger as `0x${string}`,
      abi: ACTION_LEDGER_ABI,
      functionName: 'approveAndExecuteAction',
      args: [actionId],
      account: address,
      value: valueWei,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
    };
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        isConnected: !!address,
        isConnecting,
        balance,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        approveAndExecuteOnChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within a Web3Provider');
  return context;
};
