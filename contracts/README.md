# Smart Contracts - HireU

## Contratos

5 contratos en `src/`:

- **UserRegistry.sol** - Registro y verificación de usuarios
- **UserStatistics.sol** - Estadísticas inmutables de freelancers
- **ProjectManager.sol** - Gestión de proyectos
- **EscrowPayment.sol** - Pagos con escrow y SRCW
- **WorkVerification.sol** - Verificación de trabajos

## Instalación

```bash
npm install
```

## Configuración

Crea `.env` en `contracts/`:

```env
PRIVATE_KEY=tu_private_key
LOCAL_RPC_URL=http://127.0.0.1:9650/ext/bc/C/rpc
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=opcional
```

## Comandos

```bash
npm run compile       # Compilar contratos
npm run test          # Ejecutar tests
npm run deploy:local  # Desplegar a red local
npm run deploy:fuji   # Desplegar a Fuji testnet
npm run deploy:mainnet # Desplegar a mainnet
```

## Deployment

El script `scripts/deploy.js` despliega todos los contratos en orden:

1. UserRegistry
2. UserStatistics
3. ProjectManager
4. EscrowPayment
5. WorkVerification

Las direcciones se guardan en `deployments/[network].json`.

## Integración

Después de desplegar, usa las direcciones en el frontend:

```typescript
import { useScaffoldWriteContract } from "@/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "UserRegistry",
  address: "0x...", // dirección desplegada
  abi: userRegistryAbi,
});
```

## Dependencias

- `@openzeppelin/contracts` ^5.0.0
- `hardhat` ^2.19.0
- `@nomicfoundation/hardhat-toolbox` ^4.0.0

## Redes

- **Local**: Chain ID 1337
- **Fuji**: Chain ID 43113
- **Mainnet**: Chain ID 43114
