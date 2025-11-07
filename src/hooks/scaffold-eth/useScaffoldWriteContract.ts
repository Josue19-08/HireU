import { useState } from "react";
import { useWdkProvider } from "./useWdkProvider";
import { ethers } from "ethers";

interface UseScaffoldWriteContractOptions {
  contractName: string;
  address?: string;
  abi?: any[];
}

/**
 * Hook para escribir/interactuar con contratos
 */
export function useScaffoldWriteContract({
  contractName,
  address,
  abi,
}: UseScaffoldWriteContractOptions) {
  const { signer, isReady } = useWdkProvider();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const writeContractAsync = async ({
    functionName,
    args = [],
    value,
  }: {
    functionName: string;
    args?: any[];
    value?: bigint;
  }) => {
    if (!isReady || !signer || !address || !abi) {
      throw new Error("Contract not ready. Check wallet connection.");
    }

    try {
      setIsLoading(true);
      setError(null);

      const contract = new ethers.Contract(address, abi, signer);
      const tx = await contract[functionName](...args, {
        ...(value && { value }),
      });

      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error(`Error calling ${contractName}.${functionName}:`, err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    writeContractAsync,
    isLoading,
    error,
    isReady,
  };
}

