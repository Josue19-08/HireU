import { useWdk } from "@/contexts/WdkContext";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

/**
 * Hook to get ethers.js provider using WDK
 */
export function useWdkProvider() {
  const { wdk, network, account } = useWdk();
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (!wdk || !account) {
      setProvider(null);
      setSigner(null);
      return;
    }

    try {
      // Create provider using RPC URL with static network configuration
      const rpcProvider = new ethers.JsonRpcProvider(network.rpcUrl, undefined, {
        staticNetwork: new ethers.Network("avalanche", network.chainId),
      });
      setProvider(rpcProvider);

      // Create signer using WDK
      const accountInstance = wdk.getAccount(network.chainId.toString(), 0);
      // Create wallet from private key
      const wdkSigner = new ethers.Wallet(accountInstance.privateKey, rpcProvider);
      setSigner(wdkSigner);
    } catch (error: any) {
      // Don't show error if it's a connection issue (normal in development)
      if (!error?.message?.includes("Failed to fetch")) {
        console.error("Error creating provider/signer:", error);
      }
      setProvider(null);
      setSigner(null);
    }
  }, [wdk, network, account]);

  return {
    provider,
    signer,
    isReady: !!provider && !!signer,
  };
}

