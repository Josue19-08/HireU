/**
 * Contract Addresses Configuration
 * 
 * Update these addresses after deploying the contracts
 */

export interface ContractAddresses {
  UserRegistry: string;
  UserStatistics: string;
  ProjectManager: string;
  EscrowPayment: string;
  WorkVerification: string;
  // Multichain contracts
  CrossChainManager: string;
  CrossChainProjectManager: string;
  CrossChainEscrow: string;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  contracts: Partial<ContractAddresses>;
}

// Avalanche Chain IDs
export const AVALANCHE_CHAINS = {
  C_CHAIN_MAINNET: 43114,
  C_CHAIN_FUJI: 43113,
  X_CHAIN: 2,
  P_CHAIN: 0,
  LOCAL: 1337,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [AVALANCHE_CHAINS.C_CHAIN_MAINNET]: "Avalanche C-Chain (Mainnet)",
  [AVALANCHE_CHAINS.C_CHAIN_FUJI]: "Avalanche C-Chain (Fuji)",
  [AVALANCHE_CHAINS.X_CHAIN]: "Avalanche X-Chain",
  [AVALANCHE_CHAINS.P_CHAIN]: "Avalanche P-Chain",
  [AVALANCHE_CHAINS.LOCAL]: "Local Avalanche",
};

// Contract configuration by network
export const contracts: Record<string, ContractAddresses> = {
  local: {
    UserRegistry: process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS || "",
    UserStatistics: process.env.NEXT_PUBLIC_USER_STATISTICS_ADDRESS || "",
    ProjectManager: process.env.NEXT_PUBLIC_PROJECT_MANAGER_ADDRESS || "",
    EscrowPayment: process.env.NEXT_PUBLIC_ESCROW_PAYMENT_ADDRESS || "",
    WorkVerification: process.env.NEXT_PUBLIC_WORK_VERIFICATION_ADDRESS || "",
    CrossChainManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_MANAGER_ADDRESS || "",
    CrossChainProjectManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_PROJECT_MANAGER_ADDRESS || "",
    CrossChainEscrow: process.env.NEXT_PUBLIC_CROSS_CHAIN_ESCROW_ADDRESS || "",
  },
  fuji: {
    UserRegistry: process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS_FUJI || "",
    UserStatistics: process.env.NEXT_PUBLIC_USER_STATISTICS_ADDRESS_FUJI || "",
    ProjectManager: process.env.NEXT_PUBLIC_PROJECT_MANAGER_ADDRESS_FUJI || "",
    EscrowPayment: process.env.NEXT_PUBLIC_ESCROW_PAYMENT_ADDRESS_FUJI || "",
    WorkVerification: process.env.NEXT_PUBLIC_WORK_VERIFICATION_ADDRESS_FUJI || "",
    CrossChainManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_MANAGER_ADDRESS_FUJI || "",
    CrossChainProjectManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_PROJECT_MANAGER_ADDRESS_FUJI || "",
    CrossChainEscrow: process.env.NEXT_PUBLIC_CROSS_CHAIN_ESCROW_ADDRESS_FUJI || "",
  },
  mainnet: {
    UserRegistry: process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS_MAINNET || "",
    UserStatistics: process.env.NEXT_PUBLIC_USER_STATISTICS_ADDRESS_MAINNET || "",
    ProjectManager: process.env.NEXT_PUBLIC_PROJECT_MANAGER_ADDRESS_MAINNET || "",
    EscrowPayment: process.env.NEXT_PUBLIC_ESCROW_PAYMENT_ADDRESS_MAINNET || "",
    WorkVerification: process.env.NEXT_PUBLIC_WORK_VERIFICATION_ADDRESS_MAINNET || "",
    CrossChainManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_MANAGER_ADDRESS_MAINNET || "",
    CrossChainProjectManager: process.env.NEXT_PUBLIC_CROSS_CHAIN_PROJECT_MANAGER_ADDRESS_MAINNET || "",
    CrossChainEscrow: process.env.NEXT_PUBLIC_CROSS_CHAIN_ESCROW_ADDRESS_MAINNET || "",
  },
};

/**
 * Gets contract addresses for a specific network
 */
export function getContractAddresses(network: string = "local"): ContractAddresses {
  return contracts[network] || contracts.local;
}

/**
 * Converts a chainId to bytes32 for use in contracts
 */
export function chainIdToBytes32(chainId: number): string {
  return `0x${chainId.toString(16).padStart(64, "0")}`;
}

/**
 * Converts bytes32 to chainId
 */
export function bytes32ToChainId(bytes32: string): number {
  return parseInt(bytes32, 16);
}

/**
 * Gets the name of a chain by its ID
 */
export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

