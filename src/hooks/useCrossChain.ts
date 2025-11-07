import { useState, useEffect } from "react";
import { useWdkProvider } from "./scaffold-eth/useWdkProvider";
import { useScaffoldWriteContract } from "./scaffold-eth/useScaffoldWriteContract";
import { useScaffoldReadContract } from "./scaffold-eth/useScaffoldReadContract";
import { getContractAddresses, chainIdToBytes32 } from "@/config/contracts";
import { ethers } from "ethers";

export interface CrossChainOperation {
  operationId: number;
  operationType: "ProjectCreation" | "PaymentInitiation" | "PaymentRelease" | "ProjectCompletion" | "UserRegistration";
  sourceChainId: string;
  destinationChainId: string;
  status: "Pending" | "Sent" | "Received" | "Completed" | "Failed";
  messageHash: string;
  createdAt: number;
  completedAt: number;
}

/**
 * Hook for cross-chain operations
 */
export function useCrossChain() {
  const { provider, signer, isReady } = useWdkProvider();
  const [currentNetwork, setCurrentNetwork] = useState<string>("local");
  const [availableChains, setAvailableChains] = useState<number[]>([]);

  // Get contract addresses
  const contractAddresses = getContractAddresses(currentNetwork);

  // Hook to write to CrossChainManager
  const { writeContractAsync: writeCrossChainManager, isLoading: isCrossChainLoading } = 
    useScaffoldWriteContract({
      contractName: "CrossChainManager",
      address: contractAddresses.CrossChainManager,
      abi: [], // TODO: Import real ABI
    });

  // Hook to read cross-chain operations
  const { data: operationData, refetch: refetchOperation } = useScaffoldReadContract({
    contractName: "CrossChainManager",
    functionName: "getOperation",
    address: contractAddresses.CrossChainManager,
    abi: [], // TODO: Importar ABI real
  });

  /**
   * Initiates a cross-chain operation
   */
  const initiateCrossChainOperation = async (
    operationType: CrossChainOperation["operationType"],
    destinationChainId: number,
    payload: string,
    gasLimit: number = 500000,
    value?: bigint
  ) => {
    if (!isReady || !signer) {
      throw new Error("Wallet not connected");
    }

    const destinationChainIdBytes32 = chainIdToBytes32(destinationChainId);
    
    // Map operationType to contract enum
    const operationTypeMap: Record<string, number> = {
      ProjectCreation: 0,
      PaymentInitiation: 1,
      PaymentRelease: 2,
      ProjectCompletion: 3,
      UserRegistration: 4,
    };

    const tx = await writeCrossChainManager({
      functionName: "initiateCrossChainOperation",
      args: [
        operationTypeMap[operationType],
        destinationChainIdBytes32,
        payload,
        gasLimit,
      ],
      value,
    });

    return tx;
  };

  /**
   * Gets the status of a cross-chain operation
   */
  const getOperationStatus = async (messageHash: string): Promise<CrossChainOperation | null> => {
    if (!provider || !contractAddresses.CrossChainManager) {
      return null;
    }

    try {
      // TODO: Implement real contract reading
      // For now return null
      return null;
    } catch (error) {
      console.error("Error getting operation status:", error);
      return null;
    }
  };

  /**
   * Creates a cross-chain project
   */
  const createCrossChainProject = async (
    title: string,
    description: string,
    requirementsHash: string,
    budget: bigint,
    deadline: number,
    destinationChainId: number,
    gasLimit: number = 500000
  ) => {
    if (!contractAddresses.CrossChainProjectManager) {
      throw new Error("CrossChainProjectManager not configured");
    }

    const { writeContractAsync: writeProjectManager } = useScaffoldWriteContract({
      contractName: "CrossChainProjectManager",
      address: contractAddresses.CrossChainProjectManager,
      abi: [], // TODO: Import real ABI
    });

    const destinationChainIdBytes32 = chainIdToBytes32(destinationChainId);

    const tx = await writeProjectManager({
      functionName: "createCrossChainProject",
      args: [
        title,
        description,
        requirementsHash,
        budget,
        deadline,
        destinationChainIdBytes32,
        gasLimit,
      ],
      value: ethers.parseEther("0.01"), // Fee for cross-chain message
    });

    return tx;
  };

  /**
   * Creates a cross-chain payment
   */
  const createCrossChainPayment = async (
    projectId: number,
    tokenAddress: string,
    amount: bigint,
    destinationChainId: number,
    gasLimit: number = 500000
  ) => {
    if (!contractAddresses.CrossChainEscrow) {
      throw new Error("CrossChainEscrow not configured");
    }

    const { writeContractAsync: writeEscrow } = useScaffoldWriteContract({
      contractName: "CrossChainEscrow",
      address: contractAddresses.CrossChainEscrow,
      abi: [], // TODO: Import real ABI
    });

    const destinationChainIdBytes32 = chainIdToBytes32(destinationChainId);

    const tx = await writeEscrow({
      functionName: "createCrossChainPayment",
      args: [
        projectId,
        tokenAddress,
        amount,
        destinationChainIdBytes32,
        gasLimit,
      ],
      value: amount + ethers.parseEther("0.01"), // Amount + cross-chain fee
    });

    return tx;
  };

  return {
    initiateCrossChainOperation,
    getOperationStatus,
    createCrossChainProject,
    createCrossChainPayment,
    isCrossChainLoading,
    currentNetwork,
    availableChains,
    contractAddresses,
  };
}

/**
 * Hook to monitor cross-chain operations
 */
export function useCrossChainOperation(messageHash: string | null) {
  const [operation, setOperation] = useState<CrossChainOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { provider } = useWdkProvider();
  const contractAddresses = getContractAddresses();

  useEffect(() => {
    if (!messageHash || !provider) {
      return;
    }

    const fetchOperation = async () => {
      setIsLoading(true);
      try {
        // TODO: Implement real contract reading
        // For now just simulate
        setOperation(null);
      } catch (error) {
        console.error("Error fetching operation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperation();
    
    // Polling every 5 seconds
    const interval = setInterval(fetchOperation, 5000);
    return () => clearInterval(interval);
  }, [messageHash, provider]);

  return { operation, isLoading };
}

