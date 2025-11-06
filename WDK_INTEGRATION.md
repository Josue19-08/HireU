# Integración WDK en HireU

## Implementación Actual

El WDK de Tether no está disponible como paquete npm, así que implementamos una versión propia compatible con la API esperada.

## Archivos

### `src/lib/wdk.ts`

Clase WDK que implementa:
- Generación de seed phrases (12 o 24 palabras)
- Derivación de cuentas por chainId usando BIP44
- Compatibilidad con ethers.js v6

**Uso:**
```typescript
import { WDK } from "@/lib/wdk";

// Crear wallet
const seedPhrase = WDK.getRandomSeedPhrase();
const wdk = new WDK(seedPhrase);

// Obtener cuenta para una red
const account = wdk.getAccount("43114", 0); // Mainnet
```

### `src/contexts/WdkContext.tsx`

Contexto React que maneja:
- Estado del wallet (conectado, bloqueado, balance)
- Gestión de redes (local, fuji, mainnet)
- Funciones de crear/importar/conectar wallet

**Uso:**
```typescript
import { useWdk } from "@/contexts/WdkContext";

const { account, balance, createWallet, switchNetwork } = useWdk();
```

### `src/services/seedVault.ts`

Encriptación de seed phrases:
- Web Crypto API (AES-GCM) en HTTPS
- Fallback a crypto-js en HTTP (desarrollo)
- Almacenamiento en localStorage

**Funciones:**
- `saveSeedPhrase(seedPhrase)` - Guarda encriptado
- `getSeedPhrase()` - Recupera y desencripta
- `lockWallet()` / `unlockWallet()` - Bloquear/desbloquear
- `hasSeedPhrase()` - Verifica si existe wallet

### `src/hooks/scaffold-eth/`

Hooks personalizados:

- `useWdkAccount()` - `{ address, isConnected, isLoading }`
- `useWdkBalance()` - `{ balance, formattedBalance, refresh }`
- `useWdkNetwork()` - `{ network, networkName, switchNetwork }`
- `useWdkProvider()` - `{ provider, signer, isReady }`
- `useScaffoldReadContract()` - Lee contratos
- `useScaffoldWriteContract()` - Escribe en contratos

### `src/components/wallet/`

**WalletManager.tsx**
- Página completa de gestión de wallet
- Crear/importar wallet
- Mostrar balance y dirección
- Cambiar red
- Lock/unlock
- Exportar seed phrase
- Botón "Back to Home" para volver a la página principal
- Redirección automática después de crear/importar/conectar

**WalletButton.tsx**
- Botón en navbar
- Muestra estado del wallet
- Si está conectado: muestra dirección y balance
- Si está bloqueado: muestra "Unlock Wallet"
- Si no hay wallet: muestra "Connect Wallet"

### `src/config/networks.ts`

Configuración de redes Avalanche:
- Local (Chain ID: 1337)
- Fuji Testnet (Chain ID: 43113)
- Mainnet (Chain ID: 43114)

## Flujo de Conexión

1. Usuario va a `/wallet`
2. Crea wallet o importa uno existente
3. Seed phrase se encripta y guarda
4. Wallet se inicializa automáticamente
5. Redirige a página principal (`/`)
6. Botón de wallet en navbar muestra estado conectado

## Flujo de Desbloqueo

1. Si el wallet está bloqueado, muestra pantalla de lock
2. Usuario hace click en "Unlock Wallet"
3. Si ya hay cuenta conectada, solo desbloquea
4. Si no hay cuenta, desbloquea y conecta
5. Redirige a página principal

## Problemas Conocidos

- En HTTP (desarrollo local), Web Crypto API no está disponible, usa fallback con crypto-js
- Si el nodo local no está corriendo, el balance será 0 (comportamiento esperado)
- Los errores de conexión RPC se suprimen en desarrollo para no spamear la consola
