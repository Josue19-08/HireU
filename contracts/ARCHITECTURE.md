# Arquitectura de Contratos - HireU

## Contratos

### UserRegistry

Registro de usuarios con verificación.

- Cada usuario tiene perfil con hash IPFS
- Verificación opcional (KYC, Social, Reputación)
- Solo el usuario puede actualizar su perfil

### ProjectManager

Gestión de proyectos.

**Estados:**
- Draft → Published → InProgress → Completed
- También puede ser Cancelled o Disputed

**Flujo:**
1. Cliente crea proyecto (Draft)
2. Cliente publica (Published)
3. Cliente asigna freelancer (InProgress)
4. Freelancer completa milestones
5. Cliente completa proyecto (Completed)

### EscrowPayment

Pagos con escrow usando SRCW.

- Deposita fondos en escrow
- Libera pago después de verificar trabajo
- Fee de plataforma: 2.5% por defecto
- Soporta AVAX nativo y tokens ERC20

### WorkVerification

Verificación de trabajos.

- Freelancer envía trabajo con hash IPFS
- Cliente u oráculo verifica
- Tracking de deadlines
- Sistema de evidencia adicional

### UserStatistics

Estadísticas inmutables de freelancers.

- Historial de trabajos
- Ratings y promedio
- Métricas de entrega a tiempo
- Total ganado
- Todo inmutable una vez registrado

## Dependencias entre Contratos

```
UserRegistry (independiente)
    ↓
UserStatistics (independiente)
    ↓
ProjectManager (requiere UserRegistry)
    ↓
EscrowPayment (requiere ProjectManager, UserStatistics)
    ↓
WorkVerification (requiere todos)
```

## Flujo Completo

1. Usuario se registra en UserRegistry
2. Cliente crea proyecto en ProjectManager
3. Cliente fondea escrow en EscrowPayment
4. Freelancer completa trabajo
5. Freelancer envía trabajo en WorkVerification
6. Cliente verifica en WorkVerification
7. Cliente libera pago en EscrowPayment
8. EscrowPayment registra en UserStatistics automáticamente

## Seguridad

- ReentrancyGuard en EscrowPayment
- Validación de inputs en todas las funciones
- Modifiers para control de acceso
- Datos inmutables una vez registrados
- OpenZeppelin para funciones seguras

## Gas Optimization

- Mappings separados para historial (evita problemas de gas)
- Paginación en getWorkHistory
- Events para indexación off-chain
- Structs empaquetados donde es posible
