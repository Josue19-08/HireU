import { useEffect, useState } from "react";
import { useWdkProvider } from "./useWdkProvider";
import { ethers } from "ethers";

interface UseScaffoldReadContractOptions {
  contractName: string;
  functionName: string;
  args?: any[];
  address?: string;
  abi?: any[];
}

/**
 * Hook para leer datos de contratos
 */
export function useScaffoldReadContract({
  contractName,
  functionName,
  args = [],
  address,
  abi,
}: UseScaffoldReadContractOptions) {
  const { provider, isReady } = useWdkProvider();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isReady || !provider || !address || !abi) {
      setIsLoading(false);
      return;
    }

    const readContract = async () => {
      try {
        setIsLoading(true);
        const contract = new ethers.Contract(address, abi, provider);
        const result = await contract[functionName](...args);
        setData(result);
        setError(null);
      } catch (err) {
        console.error(`Error reading ${contractName}.${functionName}:`, err);
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    readContract();
  }, [provider, isReady, address, abi, functionName, JSON.stringify(args)]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      // Trigger re-read
      setData(null);
      setIsLoading(true);
    },
  };
}

