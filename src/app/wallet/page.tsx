import WalletManager from "@/components/wallet/WalletManager";

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Avalanche Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallet and connect to Avalanche networks
          </p>
        </div>
        <WalletManager />
      </div>
    </div>
  );
}

