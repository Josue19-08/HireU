# OFFER-HUB - Freelance Platform on Avalanche

Decentralized freelance platform built on Avalanche C-Chain with smart contracts and integrated wallets.

## Project Structure

```
OFFER-HUB/
├── contracts/              # Smart contracts in Solidity
│   ├── src/               # Source contracts
│   ├── scripts/           # Deployment scripts
│   └── test/              # Contract tests
│
├── src/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   ├── contexts/          # React Context (WdkContext)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities (WDK implementation)
│   ├── services/          # Services (seedVault)
│   └── config/            # Configuration (networks)
│
└── package.json           # Frontend dependencies
```

## Installation

```bash
npm install
```

## Configuration

Create `.env.local` in the root:

```env
NEXT_PUBLIC_NETWORK=local
```

Or use `fuji` or `mainnet` as needed.

## Usage

### Development

```bash
npm run dev
```

### Wallet

1. Go to `/wallet`
2. Create or import a wallet
3. The wallet connects automatically
4. Redirects to the main page

### Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy:local  # or deploy:fuji, deploy:mainnet
```

## Main Components

### Wallet

- **WalletManager** (`src/components/wallet/WalletManager.tsx`) - Complete management page
- **WalletButton** (`src/components/wallet/WalletButton.tsx`) - Button in navbar
- **WdkContext** (`src/contexts/WdkContext.tsx`) - Global wallet state

### Hooks

- `useWdk()` - Access to wallet context
- `useWdkAccount()` - Get current account
- `useWdkBalance()` - Get formatted balance
- `useWdkNetwork()` - Manage current network
- `useWdkProvider()` - Provider and signer from ethers.js
- `useScaffoldReadContract()` - Read contracts
- `useScaffoldWriteContract()` - Write to contracts

## Configured Networks

- **Local**: `http://127.0.0.1:9650/ext/bc/C/rpc` (Chain ID: 1337)
- **Fuji**: `https://api.avax-test.network/ext/bc/C/rpc` (Chain ID: 43113)
- **Mainnet**: `https://api.avax.network/ext/bc/C/rpc` (Chain ID: 43114)

## Smart Contracts

5 contracts in `contracts/src/`:

1. **UserRegistry.sol** - User registration
2. **UserStatistics.sol** - Freelancer statistics
3. **ProjectManager.sol** - Project management
4. **EscrowPayment.sol** - Escrow payments
5. **WorkVerification.sol** - Work verification

See `contracts/README.md` for details.

## WDK Implementation

WDK is not available as an npm package, so we implemented our own version using:

- `ethers.js` v6 for wallets and providers
- `@scure/bip39` for seed phrases
- BIP44 for account derivation

The code is in `src/lib/wdk.ts` and is compatible with the expected API of the official WDK.

## Security

- Seed phrases encrypted with AES-GCM (Web Crypto API) or crypto-js (fallback on HTTP)
- Storage in localStorage (consider IndexedDB for production)
- Auto-unlock only in development
- Manual lock in production

## Notes

- Balance updates every 10 seconds when wallet is connected
- If the local node is not running, balance will show 0 without errors
- RPC connection errors are handled silently in development
