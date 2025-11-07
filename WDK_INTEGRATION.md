# WDK Integration in OFFER-HUB

## Current Implementation

Tether's WDK is not available as an npm package, so we implemented our own version compatible with the expected API.

## Features

- Seed phrase generation (12 or 24 words)
- Account derivation by chainId using BIP44
- Wallet creation and import
- Balance queries
- Transaction signing
- Network management (local, fuji, mainnet)

## File Structure

- `src/lib/wdk.ts` - WDK implementation
- `src/contexts/WdkContext.tsx` - React context for wallet state
- `src/hooks/scaffold-eth/useWdkProvider.ts` - Hook for ethers.js provider
- `src/services/seedVault.ts` - Seed phrase encryption service

## Usage

```typescript
import { useWdk } from "@/contexts/WdkContext";

const { wdk, account, balance, createWallet, importWallet } = useWdk();
```

## Security

- Seed phrases encrypted with AES-GCM (Web Crypto API) or crypto-js (fallback)
- Storage in localStorage (consider IndexedDB for production)
- Auto-unlock only in development
- Manual lock in production
