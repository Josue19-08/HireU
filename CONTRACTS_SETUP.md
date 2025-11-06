# Smart Contracts - HireU

## Contratos Implementados

5 contratos en `contracts/src/`:

### UserRegistry.sol

Registro de usuarios con verificación.

**Funciones:**
- `registerUser(username, email, profileHash, isFreelancer, isClient)` - Registra usuario
- `verifyUser(user, verificationMethod)` - Verifica usuario
- `updateProfile(profileHash)` - Actualiza hash del perfil
- `getUserProfile(user)` - Obtiene perfil completo
- `isUserVerified(user)` - Verifica si está verificado

### UserStatistics.sol

Estadísticas inmutables de freelancers.

**Funciones:**
- `recordWork(freelancer, projectId, client, amount, workHash, rating)` - Registra trabajo
- `verifyWorkDelivery(projectId, verified)` - Marca entrega a tiempo
- `getFreelancerStats(freelancer)` - Obtiene todas las estadísticas
- `getWorkHistory(freelancer, startIndex, count)` - Historial paginado
- `getOnTimeDeliveryRate(freelancer)` - Porcentaje de entregas a tiempo

### ProjectManager.sol

Gestión de proyectos freelance.

**Funciones:**
- `createProject(title, description, requirementsHash, budget, deadline)` - Crea proyecto
- `publishProject(projectId)` - Publica proyecto (Draft → Published)
- `assignFreelancer(projectId, freelancer)` - Asigna freelancer
- `createMilestone(projectId, description, amount)` - Crea milestone
- `completeMilestone(projectId, milestoneId, deliverableHash)` - Completa milestone
- `completeProject(projectId, deliverablesHash)` - Marca proyecto como completado

**Estados:**
- Draft → Published → InProgress → Completed
- También puede ser Cancelled o Disputed

### EscrowPayment.sol

Pagos con escrow usando SRCW.

**Funciones:**
- `createSRCWWallet(owner)` - Crea wallet SRCW
- `createPayment(projectId, token, amount)` - Crea pago en escrow (puede recibir AVAX)
- `fundPaymentWithToken(paymentId)` - Fondea con tokens ERC20
- `releasePayment(paymentId, workHash, rating)` - Libera pago al freelancer
- `refundPayment(paymentId)` - Reembolsa al cliente

**Fee de plataforma:** 2.5% por defecto, configurable por owner.

### WorkVerification.sol

Verificación de trabajos entregados.

**Funciones:**
- `createVerification(projectId)` - Crea verificación
- `submitWork(verificationId, workHash, evidenceHashes)` - Freelancer envía trabajo
- `verifyWork(verificationId, verified, reason)` - Cliente u oráculo verifica
- `addEvidence(verificationId, evidenceHash)` - Agrega evidencia adicional

## Deployment

### Configuración

Crea `contracts/.env`:

```env
PRIVATE_KEY=tu_private_key_aqui
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

### Compilar

```bash
cd contracts
npm install
npm run compile
```

### Desplegar

```bash
# Local
npm run deploy:local

# Fuji
npm run deploy:fuji

# Mainnet
npm run deploy:mainnet
```

El script `scripts/deploy.js` despliega todos los contratos en orden y configura las referencias cruzadas.

## Orden de Deployment

1. UserRegistry
2. UserStatistics
3. ProjectManager (requiere UserRegistry)
4. EscrowPayment (requiere ProjectManager y UserStatistics)
5. WorkVerification (requiere todos los anteriores)

Después del deployment, las direcciones se guardan en `deployments/[network].json`.

## Integración con Frontend

Después de desplegar, crea `src/config/contracts.ts`:

```typescript
export const contracts = {
  local: {
    UserRegistry: "0x...",
    UserStatistics: "0x...",
    ProjectManager: "0x...",
    EscrowPayment: "0x...",
    WorkVerification: "0x...",
  },
  fuji: { /* ... */ },
  mainnet: { /* ... */ },
};
```

Luego usa los hooks:

```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "UserRegistry",
  address: contracts[networkName].UserRegistry,
  abi: userRegistryAbi,
});

await writeContractAsync({
  functionName: "registerUser",
  args: [username, email, profileHash, true, false],
});
```

## Dependencias

- `@openzeppelin/contracts` - Para seguridad (ReentrancyGuard, Ownable)
- `hardhat` - Framework de desarrollo
- `@nomicfoundation/hardhat-toolbox` - Herramientas Hardhat

## Notas

- Todos los contratos usan Solidity 0.8.20
- Los datos una vez registrados son inmutables
- Los usuarios son dueños de sus datos
- IPFS se usa para almacenar datos off-chain (perfiles, trabajos, evidencia)
