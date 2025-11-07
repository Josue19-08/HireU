# OfferHub

Decentralized freelance platform focused on trust, guaranteed payments, and global collaboration between companies and professionals.

## Overview
OfferHub combines Avalanche smart contracts and USDT payments to ensure every milestone releases funds automatically. The Next.js frontend delivers dashboards for clients and talent, integrating verification, project management, and messaging.

## Features
- Post and manage projects with detailed requirements
- Handle applications and milestone agreements
- Escrow funds via smart contracts with conditional release
- Reputation system backed by verifiable metrics
- Responsive interface with built-in dark mode

## Architecture
- **Frontend:** Next.js 15 + TypeScript
- **UI:** Tailwind CSS, Radix UI, shadcn/ui
- **Animations:** Framer Motion
- **On-chain:** Smart contracts on Avalanche, tokenized payments in USDT (Tether)

## Prerequisites
- Node.js 18+
- npm 9+

## Installation
```bash
npm install
```

## Run locally
```bash
npm run dev
```
App available at http://localhost:3000.

## Project structure
```
src/
  components/      # UI-only components
  hooks/           # Business logic hooks named use-*
  pages/           # Orchestrator pages
  types/           # Shared type definitions
```

## Powered by
