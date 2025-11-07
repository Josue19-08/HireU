import { useWdk } from "@/contexts/WdkContext";
import { useEffect, useState } from "react";

/**
 * Hook para obtener la cuenta actual del wallet
 */
export function useWdkAccount() {
  const { account, isLoading, isInitialized } = useWdk();
  
  return {
    address: account,
    isLoading: isLoading || !isInitialized,
    isConnected: !!account,
  };
}

