# OfferHub

Decentralized freelance platform focused on trust, guaranteed payments, and global collaboration between companies and professionals. Built on Avalanche C-Chain with smart contracts, integrated wallets, and a responsive Next.js frontend.

## Overview
OfferHub combines Avalanche smart contracts and USDT payments to ensure every milestone releases funds automatically. The Next.js frontend delivers dashboards for clients and talent, integrating verification, project management, messaging, and wallet operations.

## Features
- Post and manage projects with detailed requirements
- Handle applications and milestone agreements
- Escrow funds via smart contracts with conditional release
- Reputation system backed by verifiable metrics
- Integrated wallet creation, import, and auto-connection flows
- Responsive interface with built-in dark mode

## Architecture
- **Frontend:** Next.js 15 + TypeScript
- **UI:** Tailwind CSS, Radix UI, shadcn/ui
- **Animations:** Framer Motion
- **On-chain:** Smart contracts on Avalanche with tokenized payments in USDT (Tether)

## Project structure
```
OFFER-HUB/
├── contracts/              # Smart contracts in Solidity
│   ├── src/                # Source contracts
│   ├── scripts/            # Deployment scripts
│   └── test/               # Contract tests
│
├── src/
│   ├── app/                # Next.js pages (App Router)
│   ├── components/         # UI-only React components
│   ├── hooks/              # Business logic hooks (use-*)
│   ├── contexts/           # Global React context (WdkContext)
│   ├── lib/                # Utilities (WDK implementation)
│   ├── services/           # Services (seedVault, etc.)
│   └── config/             # Network configuration
│
└── package.json            # Frontend dependencies
```

## Prerequisites
- Node.js 18+
- npm 9+

## Installation
```bash
npm install
```

## Configuration
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_NETWORK=local
```
Use `fuji` or `mainnet` as needed.

## Run locally
```bash
npm run dev
```
App available at http://localhost:3000.

## Usage
### Wallet
1. Navigate to `/wallet`
2. Create or import a wallet
3. The wallet connects automatically
4. You are redirected to the main dashboard

### Smart contracts workflow
```bash
cd contracts
npm install
npm run compile
npm run deploy:local   # or deploy:fuji, deploy:mainnet
```

## Main components
### Wallet
- **WalletManager** (`src/components/wallet/WalletManager.tsx`) — Full wallet management page
- **WalletButton** (`src/components/wallet/WalletButton.tsx`) — Navbar entry point
- **WdkContext** (`src/contexts/WdkContext.tsx`) — Global wallet state

### Hooks
- `useWdk()` — Access wallet context
- `useWdkAccount()` — Current account retrieval
- `useWdkBalance()` — Formatted balance handling
- `useWdkNetwork()` — Network management
- `useWdkProvider()` — Provider and signer (ethers.js)
- `useScaffoldReadContract()` — Read smart contracts
- `useScaffoldWriteContract()` — Write to smart contracts

## Configured networks
- **Local:** `http://127.0.0.1:9650/ext/bc/C/rpc` (Chain ID: 1337)
- **Fuji:** `https://api.avax-test.network/ext/bc/C/rpc` (Chain ID: 43113)
- **Mainnet:** `https://api.avax.network/ext/bc/C/rpc` (Chain ID: 43114)

## Smart contracts
Five contracts in `contracts/src/`:
1. **UserRegistry.sol** — User registration
2. **UserStatistics.sol** — Freelancer statistics
3. **ProjectManager.sol** — Project management
4. **EscrowPayment.sol** — Escrow payments
5. **WorkVerification.sol** — Work verification

Refer to `contracts/README.md` for extended documentation.

## WDK implementation
The Wallet Development Kit (WDK) is implemented in-house using:
- `ethers.js` v6 for wallet and provider management
- `@scure/bip39` for seed phrase generation
- BIP44 derivation for accounts

Source located at `src/lib/wdk.ts`, compatible with the official WDK API expectations.

## Security notes
- Seed phrases encrypted with AES-GCM (Web Crypto API) or `crypto-js` fallback over HTTP
- Stored in `localStorage` (consider IndexedDB for production)
- Auto-unlock available only in development
- Manual lock flow enforced in production
- Balance refresh every 10 seconds when connected; silent handling of RPC errors during development

## Powered by
- Avalanche Network
- Tether (USDT)

## Ecosystem Tags
- ecosystem: avalanche
- ecosystem: tether
