"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AVALANCHE_CHAINS, CHAIN_NAMES } from "@/config/contracts";
import { Check, Network } from "lucide-react";

interface ChainSelectorProps {
  selectedChainId: number | null;
  onChainSelect: (chainId: number) => void;
  label?: string;
  disabled?: boolean;
  excludeCurrentChain?: boolean;
  currentChainId?: number;
}

export function ChainSelector({
  selectedChainId,
  onChainSelect,
  label = "Select Destination Chain",
  disabled = false,
  excludeCurrentChain = false,
  currentChainId,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableChains = Object.values(AVALANCHE_CHAINS).filter((chainId) => {
    if (excludeCurrentChain && chainId === currentChainId) {
      return false;
    }
    return true;
  });

  const selectedChainName = selectedChainId 
    ? CHAIN_NAMES[selectedChainId] || `Chain ${selectedChainId}`
    : "Select a chain";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center justify-between px-4 py-3 bg-background border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-gray-500" />
            <span className={selectedChainId ? "text-foreground" : "text-gray-500"}>
              {selectedChainName}
            </span>
          </div>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <Card className="absolute z-20 w-full mt-1 p-2 max-h-60 overflow-y-auto">
              {availableChains.map((chainId) => {
                const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
                const isSelected = selectedChainId === chainId;
                const isCurrentChain = chainId === currentChainId;

                return (
                  <button
                    key={chainId}
                    type="button"
                    onClick={() => {
                      onChainSelect(chainId);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center justify-between ${
                      isSelected ? "bg-accent" : ""
                    } ${isCurrentChain ? "opacity-50" : ""}`}
                    disabled={isCurrentChain}
                  >
                    <span>{chainName}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#15949C]" />}
                    {isCurrentChain && (
                      <span className="text-xs text-gray-500">(Current)</span>
                    )}
                  </button>
                );
              })}
            </Card>
          </>
        )}
      </div>
      {selectedChainId && (
        <p className="text-sm text-gray-500">
          Project will be created on {CHAIN_NAMES[selectedChainId]}
        </p>
      )}
    </div>
  );
}

