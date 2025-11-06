# HireU - Plataforma Freelance en Avalanche

Plataforma freelance descentralizada construida en Avalanche C-Chain con smart contracts y wallets integrados.

## Estructura del Proyecto

```
HireU/
├── contracts/              # Smart contracts en Solidity
│   ├── src/               # Contratos fuente
│   ├── scripts/           # Scripts de deployment
│   └── test/              # Tests de contratos
│
├── src/
│   ├── app/               # Páginas Next.js
│   ├── components/        # Componentes React
│   ├── contexts/          # React Context (WdkContext)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades (WDK implementation)
│   ├── services/          # Servicios (seedVault)
│   └── config/            # Configuración (networks)
│
└── package.json           # Dependencias del frontend
```

## Instalación

```bash
npm install
```

## Configuración

Crea `.env.local` en la raíz:

```env
NEXT_PUBLIC_NETWORK=local
```

O usa `fuji` o `mainnet` según necesites.

## Uso

### Desarrollo

```bash
npm run dev
```

### Wallet

1. Ve a `/wallet`
2. Crea o importa un wallet
3. El wallet se conecta automáticamente
4. Redirige a la página principal

### Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy:local  # o deploy:fuji, deploy:mainnet
```

## Componentes Principales

### Wallet

- **WalletManager** (`src/components/wallet/WalletManager.tsx`) - Página completa de gestión
- **WalletButton** (`src/components/wallet/WalletButton.tsx`) - Botón en navbar
- **WdkContext** (`src/contexts/WdkContext.tsx`) - Estado global del wallet

### Hooks

- `useWdk()` - Acceso al contexto del wallet
- `useWdkAccount()` - Obtener cuenta actual
- `useWdkBalance()` - Obtener balance formateado
- `useWdkNetwork()` - Gestionar red actual
- `useWdkProvider()` - Provider y signer de ethers.js
- `useScaffoldReadContract()` - Leer contratos
- `useScaffoldWriteContract()` - Escribir en contratos

## Redes Configuradas

- **Local**: `http://127.0.0.1:9650/ext/bc/C/rpc` (Chain ID: 1337)
- **Fuji**: `https://api.avax-test.network/ext/bc/C/rpc` (Chain ID: 43113)
- **Mainnet**: `https://api.avax.network/ext/bc/C/rpc` (Chain ID: 43114)

## Smart Contracts

5 contratos en `contracts/src/`:

1. **UserRegistry.sol** - Registro de usuarios
2. **UserStatistics.sol** - Estadísticas de freelancers
3. **ProjectManager.sol** - Gestión de proyectos
4. **EscrowPayment.sol** - Pagos con escrow
5. **WorkVerification.sol** - Verificación de trabajos

Ver `contracts/README.md` para detalles.

## Implementación WDK

El WDK no está disponible como paquete npm, así que implementamos una versión propia usando:

- `ethers.js` v6 para wallets y providers
- `@scure/bip39` para seed phrases
- BIP44 para derivación de cuentas

El código está en `src/lib/wdk.ts` y es compatible con la API esperada del WDK oficial.

## Seguridad

- Seed phrases encriptadas con AES-GCM (Web Crypto API) o crypto-js (fallback en HTTP)
- Almacenamiento en localStorage (considerar IndexedDB para producción)
- Auto-unlock solo en desarrollo
- Lock manual en producción

## Notas

- El balance se actualiza cada 10 segundos cuando el wallet está conectado
- Si el nodo local no está corriendo, el balance mostrará 0 sin errores
- Los errores de conexión RPC se manejan silenciosamente en desarrollo
