# Estado de la Integración - HireU

## Lo que está implementado

### Smart Contracts

5 contratos en `contracts/src/`:

1. **UserRegistry.sol** - Registro y verificación de usuarios
2. **UserStatistics.sol** - Estadísticas inmutables de freelancers  
3. **ProjectManager.sol** - Gestión de proyectos
4. **EscrowPayment.sol** - Pagos con escrow y SRCW
5. **WorkVerification.sol** - Verificación de trabajos

Todos compilados y listos para desplegar.

### Wallet Integration

**Implementación propia del WDK** (el SDK oficial no existe en npm):

- `src/lib/wdk.ts` - Clase WDK usando ethers.js y BIP39
- `src/contexts/WdkContext.tsx` - Contexto global del wallet
- `src/components/wallet/WalletManager.tsx` - UI completa de gestión
- `src/components/wallet/WalletButton.tsx` - Botón en navbar
- `src/services/seedVault.ts` - Encriptación de seed phrases

**Funcionalidades:**
- Crear wallet (genera seed phrase de 12 palabras)
- Importar wallet (desde seed phrase)
- Mostrar balance y dirección
- Cambiar entre redes (Local/Fuji/Mainnet)
- Lock/unlock wallet
- Exportar seed phrase
- Redirección automática después de conectar

### Hooks

6 hooks en `src/hooks/scaffold-eth/`:

- `useWdkAccount()` - Obtener cuenta actual
- `useWdkBalance()` - Obtener balance formateado
- `useWdkNetwork()` - Gestionar red
- `useWdkProvider()` - Provider y signer de ethers.js
- `useScaffoldReadContract()` - Leer contratos
- `useScaffoldWriteContract()` - Escribir en contratos

### Configuración

- `src/config/networks.ts` - Redes Avalanche configuradas
- Auto-detección de Web Crypto API (HTTPS) o fallback a crypto-js (HTTP)
- Manejo de errores silencioso para conexiones RPC fallidas

## Cómo usar

### Primera vez

```bash
npm install
npm run dev
```

Ve a `http://localhost:3000/wallet` y crea un wallet.

### Desplegar contratos

```bash
cd contracts
npm install
npm run compile
npm run deploy:fuji  # o deploy:local, deploy:mainnet
```

Después, actualiza `src/config/contracts.ts` con las direcciones desplegadas.

## Flujo actual

1. Usuario crea/importa wallet en `/wallet`
2. Seed phrase se encripta y guarda
3. Wallet se conecta automáticamente
4. Redirige a página principal
5. Botón de wallet en navbar muestra estado

## Problemas conocidos

- En HTTP (desarrollo), usa crypto-js en lugar de Web Crypto API
- Si el nodo local no está corriendo, balance muestra 0 (normal)
- Los contratos aún no están integrados en el frontend (necesitas ABIs y direcciones)

## Próximos pasos

1. Desplegar contratos en Fuji testnet
2. Crear archivo de configuración con direcciones
3. Integrar ABIs de los contratos
4. Conectar UI con funciones de contratos
5. Configurar IPFS para subir perfiles y trabajos
