"use client";

import { useWdk } from "@/contexts/WdkContext";
import { useWdkAccount, useWdkBalance } from "@/hooks/scaffold-eth";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WalletButton() {
  const { account, isLocked, hasWallet, disconnectWallet, lock } = useWdk();
  const { address, isConnected } = useWdkAccount();
  const { formattedBalance } = useWdkBalance();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!hasWallet) {
    return (
      <Link href="/wallet">
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
      </Link>
    );
  }

  if (isLocked) {
    return (
      <Link href="/wallet">
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Unlock Wallet</span>
        </Button>
      </Link>
    );
  }

  if (!isConnected) {
    return (
      <Link href="/wallet">
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline">
            {address ? formatAddress(address) : "Wallet"}
          </span>
          <span className="hidden sm:inline text-green-600 dark:text-green-400">
            Conectado
          </span>
          {formattedBalance && (
            <span className="hidden md:inline text-[#15949C] font-semibold">
              {formattedBalance} AVAX
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Wallet</span>
            <span className="font-mono text-sm">{address}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/wallet" className="w-full">
            Manage Wallet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={lock}>
          Lock Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

