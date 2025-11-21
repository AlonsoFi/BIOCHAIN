# 🚀 BioChain Setup Guide

## Prerequisitos

- Node.js 18+
- Rust (latest stable)
- Soroban CLI
- Docker (opcional, para desarrollo)

## Instalación

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con tus variables
npm run dev
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Smart Contracts

```bash
# Instalar Soroban CLI
curl -sSL https://soroban.stellar.org | sh

# Compilar contratos
cd contracts/study_registry
cargo build --target wasm32-unknown-unknown --release

cd ../dataset_marketplace
cargo build --target wasm32-unknown-unknown --release

cd ../revenue_splitter
cargo build --target wasm32-unknown-unknown --release
```

### 4. Tests de Contratos

```bash
cd contracts/study_registry
cargo test

cd ../dataset_marketplace
cargo test

cd ../revenue_splitter
cargo test
```

## Docker

```bash
docker-compose up --build
```

## Variables de Entorno

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STELLAR_NETWORK=testnet
VITE_CONTRACT_STUDY_REGISTRY=<contract_id>
VITE_CONTRACT_MARKETPLACE=<contract_id>
VITE_CONTRACT_REVENUE=<contract_id>
VITE_GOOGLE_CLIENT_ID=<google_client_id>
VITE_CONTRACT_ID=<hoblayerta_contract_id>
```

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
STELLAR_NETWORK=testnet
```

## Deploy de Contratos

```bash
# Configurar secret key
export SECRET_KEY="your_secret_key"
export NETWORK="testnet"

# Deploy
cd contracts/study_registry
make deploy

cd ../dataset_marketplace
make deploy

cd ../revenue_splitter
make deploy
```

## Desarrollo

1. Iniciar backend: `cd backend && npm run dev`
2. Iniciar frontend: `cd frontend && npm run dev`
3. Acceder a: http://localhost:3000

## Troubleshooting

- **Error de compilación de contratos**: Asegúrate de tener Rust y Soroban CLI instalados
- **Error de conexión**: Verifica que el backend esté corriendo en puerto 5000
- **Error de wallet**: Configura las variables de entorno correctamente

