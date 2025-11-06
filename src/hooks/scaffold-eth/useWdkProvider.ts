import { useWdk } from "@/contexts/WdkContext";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

/**
 * Hook para obtener el provider de ethers.js usando WDK
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
      // Crear provider usando la RPC URL con configuración de red estática
      const rpcProvider = new ethers.JsonRpcProvider(network.rpcUrl, undefined, {
        staticNetwork: new ethers.Network("avalanche", network.chainId),
      });
      setProvider(rpcProvider);

      // Crear signer usando WDK
      const accountInstance = wdk.getAccount(network.chainId.toString(), 0);
      // Crear wallet desde private key
      const wdkSigner = new ethers.Wallet(accountInstance.privateKey, rpcProvider);
      setSigner(wdkSigner);
    } catch (error: any) {
      // No mostrar error si es un problema de conexión (normal en desarrollo)
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

