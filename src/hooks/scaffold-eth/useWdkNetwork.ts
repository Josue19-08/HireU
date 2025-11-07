import { useWdk } from "@/contexts/WdkContext";
import { NetworkConfig } from "@/config/networks";

/**
 * Hook para obtener y cambiar la red actual
 */
export function useWdkNetwork() {
  const { network, networkName, switchNetwork } = useWdk();

  return {
    network,
    networkName,
    chainId: network.chainId,
    switchNetwork,
  };
}

