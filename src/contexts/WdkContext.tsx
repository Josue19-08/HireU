"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { WDK } from "@/lib/wdk";
import { getNetworkConfig, NetworkConfig } from "@/config/networks";
import {
  saveSeedPhrase,
  getSeedPhrase,
  isWalletUnlocked,
  lockWallet,
  unlockWallet,
  clearSeedPhrase,
  hasSeedPhrase,
} from "@/services/seedVault";
import { ethers } from "ethers";

interface WdkContextType {
  // WDK instance
  wdk: WDK | null;
  // Account
  account: string | null;
  // Balance
  balance: string;
  // Network
  network: NetworkConfig;
  networkName: string;
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  // Wallet state
  isLocked: boolean;
  hasWallet: boolean;
  // Methods
  createWallet: () => Promise<string>;
  importWallet: (seedPhrase: string) => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (networkName: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

const WdkContext = createContext<WdkContextType | undefined>(undefined);

export function WdkProvider({ children }: { children: React.ReactNode }) {
  const [wdk, setWdk] = useState<WDK | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [networkName, setNetworkName] = useState<string>(
    process.env.NEXT_PUBLIC_NETWORK || "local"
  );
  const [network, setNetwork] = useState<NetworkConfig>(getNetworkConfig(networkName));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Initialize WDK
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Check if wallet exists
        const hasWallet = hasSeedPhrase();
        const unlocked = isWalletUnlocked();

        if (hasWallet && unlocked) {
          const seedPhrase = await getSeedPhrase();
          if (seedPhrase) {
            await initializeWallet(seedPhrase);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing WDK:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const initializeWallet = useCallback(async (seedPhrase: string) => {
    try {
      const wdkInstance = new WDK(seedPhrase);
      const currentNetwork = getNetworkConfig(networkName);
      
      // Get account for current network
      const accountInstance = wdkInstance.getAccount(
        currentNetwork.chainId.toString(),
        0
      );
      const accountAddress = accountInstance.address;

      setWdk(wdkInstance);
      setAccount(accountAddress);
      setIsLocked(false);

      // Fetch balance (necesitamos provider)
      try {
        const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl, undefined, {
          staticNetwork: new ethers.Network("avalanche", currentNetwork.chainId),
        });
        // Intentar obtener balance con timeout
        const balance = await Promise.race([
          accountInstance.getBalance(provider),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Balance fetch timeout")), 5000)
          )
        ]) as string;
        setBalance(balance);
      } catch (error: any) {
        console.warn("Error fetching balance (this is normal if local node is not running):", error?.message || error);
        setBalance("0");
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
      throw error;
    }
  }, [networkName]);

  const refreshBalance = useCallback(async (
    address?: string,
    wdkInstance?: WDK | null,
    networkConfig?: NetworkConfig
  ) => {
    try {
      const addr = address || account;
      const wdkInst = wdkInstance || wdk;
      const netConfig = networkConfig || network;

      if (!addr || !wdkInst) {
        setBalance("0");
        return;
      }

      const provider = new ethers.JsonRpcProvider(netConfig.rpcUrl, undefined, {
        staticNetwork: new ethers.Network("avalanche", netConfig.chainId),
      });
      
      const accountInstance = wdkInst.getAccount(netConfig.chainId.toString(), 0);
      
      // Intentar obtener balance con timeout
      const bal = await Promise.race([
        accountInstance.getBalance(provider),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error("Balance fetch timeout")), 5000)
        )
      ]) as string;
      
      setBalance(bal);
    } catch (error: any) {
      // No mostrar error si es un timeout o conexión fallida (normal en desarrollo)
      if (!error?.message?.includes("timeout") && !error?.message?.includes("Failed to fetch")) {
        console.warn("Error refreshing balance:", error?.message || error);
      }
      setBalance("0");
    }
  }, [account, wdk, network]);

  const createWallet = useCallback(async (): Promise<string> => {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      throw new Error("Wallet creation is only available in browser environment");
    }
    
    try {
      const seedPhrase = WDK.getRandomSeedPhrase();
      await saveSeedPhrase(seedPhrase);
      await initializeWallet(seedPhrase);
      return seedPhrase;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }, [initializeWallet]);

  const importWallet = useCallback(async (seedPhrase: string) => {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      throw new Error("Wallet import is only available in browser environment");
    }
    
    try {
      await saveSeedPhrase(seedPhrase);
      await initializeWallet(seedPhrase);
    } catch (error) {
      console.error("Error importing wallet:", error);
      throw error;
    }
  }, [initializeWallet]);

  const connectWallet = useCallback(async () => {
    try {
      if (!hasSeedPhrase()) {
        throw new Error("No wallet found. Please create or import a wallet first.");
      }

      if (isLocked) {
        throw new Error("Wallet is locked. Please unlock first.");
      }

      const seedPhrase = await getSeedPhrase();
      if (seedPhrase) {
        await initializeWallet(seedPhrase);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }, [isLocked, initializeWallet]);

  const disconnectWallet = useCallback(() => {
    setWdk(null);
    setAccount(null);
    setBalance("0");
    lockWallet();
    setIsLocked(true);
  }, []);

  const switchNetwork = useCallback(async (newNetworkName: string) => {
    try {
      setNetworkName(newNetworkName);
      const newNetwork = getNetworkConfig(newNetworkName);
      setNetwork(newNetwork);

      if (wdk && account) {
        // Refresh account for new network
        const accountInstance = wdk.getAccount(newNetwork.chainId.toString(), 0);
        const newAccount = accountInstance.address;
        setAccount(newAccount);
        
        // Refresh balance with new network
        try {
          const provider = new ethers.JsonRpcProvider(newNetwork.rpcUrl, undefined, {
            staticNetwork: new ethers.Network("avalanche", newNetwork.chainId),
          });
          
          const balance = await Promise.race([
            accountInstance.getBalance(provider),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error("Balance fetch timeout")), 5000)
            )
          ]) as string;
          
          setBalance(balance);
        } catch (error: any) {
          // No mostrar error si es un timeout o conexión fallida
          if (!error?.message?.includes("timeout") && !error?.message?.includes("Failed to fetch")) {
            console.warn("Error fetching balance:", error?.message || error);
          }
          setBalance("0");
        }
      }
    } catch (error) {
      console.error("Error switching network:", error);
      throw error;
    }
  }, [wdk, account, refreshBalance]);

  const lock = useCallback(() => {
    lockWallet();
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    unlockWallet();
    setIsLocked(false);
  }, []);

  // Auto-refresh balance periodically
  useEffect(() => {
    if (!account || !wdk) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [account, wdk, refreshBalance]);

  const value: WdkContextType = {
    wdk,
    account,
    balance,
    network,
    networkName,
    isLoading,
    isInitialized,
    isLocked,
    hasWallet: hasSeedPhrase(),
    createWallet,
    importWallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance: () => refreshBalance(),
    lock,
    unlock,
  };

  return <WdkContext.Provider value={value}>{children}</WdkContext.Provider>;
}

export function useWdk() {
  const context = useContext(WdkContext);
  if (context === undefined) {
    throw new Error("useWdk must be used within a WdkProvider");
  }
  return context;
}

