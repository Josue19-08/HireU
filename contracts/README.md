# Smart Contracts - OFFER-HUB

## Contracts

5 contracts in `src/`:

- **UserRegistry.sol** - User registration and verification
- **UserStatistics.sol** - Immutable freelancer statistics
- **ProjectManager.sol** - Project management
- **EscrowPayment.sol** - Escrow payments with SRCW
- **WorkVerification.sol** - Work verification

## Installation

```bash
npm install
```

## Configuration

Create `.env` in `contracts/`:

```env
PRIVATE_KEY=your_private_key
LOCAL_RPC_URL=http://127.0.0.1:9650/ext/bc/C/rpc
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=optional
```

## Commands

```bash
npm run compile       # Compile contracts
npm run test          # Run tests
npm run deploy:local  # Deploy to local network
npm run deploy:fuji   # Deploy to Fuji testnet
npm run deploy:mainnet # Deploy to mainnet
```

## Deployment

The `scripts/deploy.js` script deploys all contracts in order:

1. UserRegistry
2. UserStatistics
3. ProjectManager
4. EscrowPayment
5. WorkVerification

Addresses are saved in `deployments/[network].json`.

## Integration

After deploying, use the addresses in the frontend:

```typescript
import { useScaffoldWriteContract } from "@/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "UserRegistry",
  address: "0x...", // deployed address
  abi: userRegistryAbi,
});
```

## Dependencies

- `@openzeppelin/contracts` ^5.0.0
- `hardhat` ^2.19.0
- `@nomicfoundation/hardhat-toolbox` ^4.0.0

## Networks

- **Local**: Chain ID 1337
- **Fuji**: Chain ID 43113
- **Mainnet**: Chain ID 43114
