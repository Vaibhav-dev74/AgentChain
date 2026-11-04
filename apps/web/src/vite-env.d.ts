/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AGENT_REGISTRY_ADDRESS?: string;
  readonly VITE_POLICY_MANAGER_ADDRESS?: string;
  readonly VITE_ACTION_LEDGER_ADDRESS?: string;
  readonly VITE_REWARD_VAULT_ADDRESS?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: any;
}
