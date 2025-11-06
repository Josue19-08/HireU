# Deployment en Fuji Testnet

## Paso 1: Configurar .env

Crea el archivo `contracts/.env`:

```bash
cd contracts
cp .env.example .env
```

Luego edita `.env` y agrega tu private key:

```env
PRIVATE_KEY=tu_private_key_sin_0x
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

## Paso 2: Obtener AVAX de Testnet

Necesitas AVAX en Fuji para pagar gas. Obtén en:

- https://faucets.chain.link/fuji (requiere GitHub/Google)
- https://faucet.quicknode.com/avalanche/fuji
- https://build.avax.network/console/primary-network/faucet

## Paso 3: Desplegar

```bash
npm run deploy:fuji
```

El script despliega todos los contratos y guarda las direcciones en `deployments/fuji.json`.

## Resultado

Después del deployment tendrás:
- `deployments/fuji.json` con todas las direcciones
- Contratos verificables en Snowtrace (si agregaste SNOWTRACE_API_KEY)

## Integrar con Frontend

Copia las direcciones de `deployments/fuji.json` a `src/config/contracts.ts` en el frontend.
