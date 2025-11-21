# 🧬 BioChain - MVP

Plataforma descentralizada para compartir datos médicos anonimizados usando Stellar + Soroban.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Paltalabs UI + Account Abstraction
- **Backend**: Node.js + TypeScript + Express
- **Smart Contracts**: Soroban (Rust)
- **Zero-Knowledge**: BN254 + RISC Zero (mock en MVP)

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+
- Rust + Soroban CLI
- Docker (para mock CVM)

### Instalación

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# Contracts
cd contracts/study_registry
cargo build --target wasm32-unknown-unknown
```

### Docker

```bash
docker-compose up --build
```

## 📁 Estructura

```
/frontend          # React + TypeScript + Paltalabs UI
/backend           # Node.js + Express + Services
/contracts         # Soroban Smart Contracts (Rust)
/docs              # Documentación
```

## 🔐 Account Abstraction

Usa SDK de Hoblayerta para login OAuth → wallet Stellar automática.

## 📜 Smart Contracts

1. **StudyRegistry**: Registra estudios médicos
2. **DatasetMarketplace**: Marketplace de datasets
3. **RevenueSplitter**: Distribuye pagos (85% contributors, 15% BioChain)

## 📚 Documentación

# Ver `/docs/architecture.md` para detalles completos.

# BIOCHAIN

Nuestro proyecto para la Stellar Hack + 2025

> > > > > > > ed1614fe8809405666c54b2df5aff41fb032094a
