"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWdk } from "@/contexts/WdkContext";
import { useWdkBalance } from "@/hooks/scaffold-eth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Eye, EyeOff, Lock, Unlock, Wallet, CheckCircle2, AlertCircle, Loader2, Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function WalletManager() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    account,
    balance,
    network,
    networkName,
    isLoading,
    isLocked,
    hasWallet,
    createWallet,
    importWallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    lock,
    unlock,
  } = useWdk();
  const { formattedBalance } = useWdkBalance();

  // Asegurar que solo se ejecute en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [importSeed, setImportSeed] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  const handleCreateWallet = async () => {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      toast.error("Wallet creation is only available in browser");
      return;
    }

    try {
      setIsCreating(true);
      const newSeedPhrase = await createWallet();
      setSeedPhrase(newSeedPhrase);
      toast.success("Wallet created successfully!");
      
      // Redirigir a la página principal después de crear el wallet
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create wallet";
      toast.error(errorMessage);
      console.error("Error creating wallet:", error);
      
      // Si el error es por crypto no disponible, mostrar mensaje más claro
      if (errorMessage.includes("Crypto API") || errorMessage.includes("crypto.subtle")) {
        toast.error("Web Crypto API is not available. Please use a modern browser.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportWallet = async () => {
    if (!importSeed.trim()) {
      toast.error("Please enter a seed phrase");
      return;
    }

    try {
      setIsImporting(true);
      await importWallet(importSeed.trim());
      setImportSeed("");
      toast.success("Wallet imported successfully!");
      
      // Redirigir a la página principal después de importar el wallet
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to import wallet");
      console.error("Error importing wallet:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connectWallet();
      toast.success("Wallet connected!");
      
      // Redirigir a la página principal después de conectar
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.info("Wallet disconnected");
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success("Address copied to clipboard!");
    }
  };

  const handleCopySeedPhrase = () => {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase);
      toast.success("Seed phrase copied to clipboard!");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // No renderizar nada hasta que esté montado en el cliente
  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#15949C]" />
      </div>
    );
  }

  // No wallet exists
  if (!hasWallet) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Avalanche Wallet
            </CardTitle>
            <CardDescription>
              Create or import a wallet to start using HireU on Avalanche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create New Wallet */}
            <div className="space-y-4">
              <h3 className="font-semibold">Create New Wallet</h3>
              <Button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="w-full bg-[#15949C] hover:bg-[#15949C]/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Create New Wallet
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Import Existing Wallet */}
            <div className="space-y-4">
              <h3 className="font-semibold">Import Existing Wallet</h3>
              <div className="space-y-2">
                <Label htmlFor="seed-phrase">Seed Phrase (12 or 24 words)</Label>
                <Input
                  id="seed-phrase"
                  type="text"
                  placeholder="word1 word2 word3..."
                  value={importSeed}
                  onChange={(e) => setImportSeed(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleImportWallet}
                disabled={isImporting || !importSeed.trim()}
                variant="outline"
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Wallet"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wallet exists but locked
  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Botón para ir a página principal */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Wallet Locked
            </CardTitle>
            <CardDescription>
              Your wallet is locked. Unlock it to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={async () => {
                unlock();
                // Si ya hay cuenta, no necesitamos conectar de nuevo
                if (!account) {
                  await handleConnect();
                } else {
                  // Solo desbloquear si ya está conectado
                  toast.success("Wallet unlocked!");
                  setTimeout(() => {
                    router.push("/");
                  }, 1000);
                }
              }}
              disabled={isConnecting}
              className="w-full bg-[#15949C] hover:bg-[#15949C]/90"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Wallet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wallet connected
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Botón para ir a página principal */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            My Wallet
          </CardTitle>
          <CardDescription>
            Connected to {network.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono">
                {account ? formatAddress(account) : "Not connected"}
              </code>
              {account && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <Label>Balance</Label>
            <div className="text-2xl font-bold text-[#15949C]">
              {formattedBalance} {network.currency}
            </div>
          </div>

          {/* Network Selector */}
          <div className="space-y-2">
            <Label>Network</Label>
            <div className="flex gap-2">
              {["local", "fuji", "mainnet"].map((net) => (
                <Button
                  key={net}
                  size="sm"
                  variant={networkName === net ? "default" : "outline"}
                  onClick={() => switchNetwork(net)}
                  className={networkName === net ? "bg-[#15949C]" : ""}
                >
                  {net.charAt(0).toUpperCase() + net.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={lock}
              className="flex-1"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock Wallet
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seed Phrase Dialog */}
      {seedPhrase && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-5 h-5" />
              Important: Save Your Seed Phrase
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              This is the only way to recover your wallet. Save it securely and never share it with anyone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirmed-saved"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="confirmed-saved" className="cursor-pointer">
                I have securely saved my seed phrase
              </Label>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded-md text-sm font-mono">
                  {showSeedPhrase ? seedPhrase : "•".repeat(50)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                >
                  {showSeedPhrase ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySeedPhrase}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

