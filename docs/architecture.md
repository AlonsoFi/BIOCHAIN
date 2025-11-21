# 🏗️ BioChain Architecture

## Overview

BioChain es una plataforma descentralizada que permite compartir datos médicos anonimizados usando Stellar + Soroban.

## Arquitectura General

```
┌─────────────┐
│   Frontend  │ React + TypeScript + Paltalabs UI
│  (React)    │ Account Abstraction (Hoblayerta SDK)
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼──────┐
│   Backend   │ Node.js + Express + TypeScript
│  (Express)  │
└──────┬──────┘
       │
       ├──► CVM Gateway (Mock NVIDIA TEE)
       ├──► ZK Prover (Mock BN254 + RISC Zero)
       └──► Dataset Aggregator
       │
       │ Soroban RPC
       │
┌──────▼──────┐
│  Soroban    │ Smart Contracts (Rust)
│ Contracts   │
│             │ - StudyRegistry
│             │ - DatasetMarketplace
│             │ - RevenueSplitter
└─────────────┘
```

## Componentes Principales

### Frontend

- **React + TypeScript**: Framework principal
- **Paltalabs UI**: Componentes Web3 optimizados
- **Account Abstraction**: SDK de Hoblayerta para login OAuth → wallet Stellar
- **Soroban Client**: Para interactuar con smart contracts

### Backend

- **Express + TypeScript**: API REST
- **CVM Gateway**: Mock de NVIDIA Confidential VM (TEE)
- **ZK Prover**: Mock de Zero-Knowledge Proofs (BN254 + RISC Zero)
- **Dataset Aggregator**: Agrupa estudios en datasets vendibles

### Smart Contracts (Soroban)

1. **StudyRegistry**: Registra estudios médicos
2. **DatasetMarketplace**: Marketplace de datasets
3. **RevenueSplitter**: Distribuye pagos (85% contributors, 15% treasury)

## Flujos Principales

### Flujo Usuario (Contribuyente)

1. Login con Google OAuth → Wallet Stellar automática
2. Completa historia clínica (4 pasos)
3. Firma consentimiento
4. Sube PDF de estudio
5. Backend procesa en CVM (mock) → hash + metadata
6. Backend genera ZK proof (mock)
7. Frontend llama `register_study()` en Soroban
8. Estudio registrado en blockchain

### Flujo Investigador

1. Login con Google OAuth → Wallet Stellar
2. Explora marketplace de datasets
3. Compra dataset (pago vía SEP-24 anchor → USDC)
4. Frontend llama `purchase_dataset()` en Soroban
5. Contrato distribuye pagos automáticamente
6. Backend entrega access token para descargar dataset

## Seguridad y Privacidad

- **NO se almacenan PDFs**: Solo se procesan en CVM y se destruyen
- **Datos anonimizados**: Historia clínica se anonimiza antes de guardar
- **Zero-Knowledge Proofs**: Prueban validez sin revelar contenido
- **Trusted Execution Environment**: Procesamiento seguro en NVIDIA CVM

## TODOs para Producción

- [ ] Integrar SDK real de Hoblayerta
- [ ] Conectar con NVIDIA CVM real
- [ ] Implementar ZK Prover real (BN254 + RISC Zero)
- [ ] Integrar SEP-24 anchor real
- [ ] Migrar a PostgreSQL/Supabase
- [ ] Deploy contratos a Soroban mainnet
- [ ] Implementar transferencias USDC reales

