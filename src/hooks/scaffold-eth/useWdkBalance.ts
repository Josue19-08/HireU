import { useWdk } from "@/contexts/WdkContext";
import { useEffect, useState } from "react";

/**
 * Hook para obtener el balance de AVAX de la cuenta actual
 */
export function useWdkBalance() {
  const { balance, account, refreshBalance, isLoading } = useWdk();
  const [formattedBalance, setFormattedBalance] = useState<string>("0.00");

  useEffect(() => {
    if (account && balance) {
      // Convertir wei a AVAX (1 AVAX = 10^18 wei)
      const balanceInAvax = parseFloat(balance) / 1e18;
      setFormattedBalance(balanceInAvax.toFixed(4));
    } else {
      setFormattedBalance("0.00");
    }
  }, [balance, account]);

  return {
    balance: balance || "0",
    formattedBalance,
    isLoading,
    refresh: refreshBalance,
  };
}

