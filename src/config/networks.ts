/**
 * Network Configuration for Avalanche C-Chain
 * Configuraciones de red para Avalanche C-Chain
 */

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  currency: string;
  blockExplorer?: string;
}

export const networks: Record<string, NetworkConfig> = {
  local: {
    chainId: 1337,
    rpcUrl: "http://127.0.0.1:9650/ext/bc/C/rpc",
    name: "Local Avalanche",
    currency: "AVAX",
    blockExplorer: undefined,
  },
  fuji: {
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    name: "Avalanche Fuji Testnet",
    currency: "AVAX",
    blockExplorer: "https://testnet.snowtrace.io",
  },
  mainnet: {
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    name: "Avalanche Mainnet",
    currency: "AVAX",
    blockExplorer: "https://snowtrace.io",
  },
};

export const defaultNetwork = process.env.NEXT_PUBLIC_NETWORK || "local";

export const getNetworkConfig = (networkName: string = defaultNetwork): NetworkConfig => {
  return networks[networkName] || networks[defaultNetwork];
};

export const getNetworkName = (chainId: number): string => {
  for (const [name, config] of Object.entries(networks)) {
    if (config.chainId === chainId) {
      return name;
    }
  }
  return defaultNetwork;
};

