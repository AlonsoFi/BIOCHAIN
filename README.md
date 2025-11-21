# 🧬 BioChain - MVP

Plataforma descentralizada para compartir datos médicos anonimizados usando Stellar + Soroban.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Paltalabs UI + Account Abstraction
- **Backend**: Node.js + TypeScript + Express
- **Smart Contracts**: Soroban (Rust)
- **Zero-Knowledge**: BN254 + RISC Zero (mock en MVP)

## 🚀 Quick Start

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd BIOCHAIN

# 2. Levantar servicios
docker-compose up --build

# 3. Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Opción 2: Desarrollo Local

#### Prerequisitos

- Node.js 18+
- Docker (opcional, para desarrollo)

#### Instalación

```bash
# Backend
cd backend
npm install
npm run dev
# Backend corre en http://localhost:5000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
# Frontend corre en http://localhost:3000
```

### Variables de Entorno

Los archivos `.env.example` están en `backend/` y `frontend/`. Copia a `.env` y configura según necesites.

**Backend (.env)**:
- `PORT=5000` (puerto del servidor)
- `NODE_ENV=development`
- `LOG_LEVEL=info`
- `STELLAR_NETWORK=testnet`

**Frontend (.env.local)**:
- `VITE_API_URL=http://localhost:5000/api`
- `VITE_STELLAR_NETWORK=testnet`

## 📁 Estructura

```
/frontend          # React + TypeScript + Paltalabs UI
/backend           # Node.js + Express + Services
  /src
    /routes        # API endpoints
    /services      # Lógica de negocio
    /utils         # Utilidades (logger, validation)
    /tests         # Tests unitarios
/contracts         # Soroban Smart Contracts (Rust)
/docs              # Documentación
```

## 🔐 Account Abstraction

Usa SDK de Hoblayerta para login OAuth → wallet Stellar automática. Actualmente en modo mock para desarrollo.

## 📜 Smart Contracts

1. **StudyRegistry**: Registra estudios médicos en blockchain
2. **DatasetMarketplace**: Marketplace de datasets
3. **RevenueSplitter**: Distribuye pagos (85% contributors, 15% BioChain)

**Nota**: Los contratos están implementados pero las transacciones son mock para el MVP.

## 🧪 Testing

```bash
# Ejecutar tests del backend
cd backend
npm test

# Tests en modo watch
npm run test:watch
```

## 📊 Persistencia de Datos

Los datos se guardan en archivos JSON en `backend/data/`:
- `user-data.json` - Historias clínicas y consentimientos
- `datasets.json` - Datasets del marketplace
- `studies.json` - Estudios registrados
- `user-studies.json` - Estudios por usuario

**Nota**: En producción se usaría PostgreSQL o Supabase.

## 🔄 Flujos Principales

### Flujo Usuario (Contribuyente)
1. Login con Google OAuth (mock)
2. Completar historia clínica
3. Subir estudios médicos (PDF)
4. Ver estudios y ganancias en dashboard

### Flujo Investigador
1. Login con Google OAuth (mock)
2. Buscar datasets en marketplace
3. Ver detalles del dataset
4. Comprar dataset (checkout con métodos de pago)
5. Recibir access token para descargar

## 📚 Documentación

- `/docs/architecture.md` - Arquitectura completa
- `/docs/DIAGRAMA_FLUJO.md` - Diagramas de flujo
- `/docs/FLUJO_COMPLETO_USUARIO.md` - Flujo detallado del usuario
- `/QUE_HACE_LA_APLICACION.md` - Descripción completa de funcionalidades

## ⚠️ Estado Actual

### ✅ Implementado
- Frontend completo con todas las páginas
- Backend con API REST completa
- Persistencia de datos en archivos JSON
- Tests unitarios (16 tests pasando)
- Validación con Zod
- Logging estructurado con Winston

### 🟡 Mock (OK para hackathon)
- Transacciones Soroban (simuladas)
- Pagos USDC (simulados)
- ZK Proofs (estructura correcta, no proofs reales)
- CVM NVIDIA (mock)
- Account Abstraction (estructura lista para SDK real)

### 🔴 Para Producción
- Integrar SDK Hoblayerta real
- Deploy contratos Soroban a testnet/mainnet
- Transacciones reales en blockchain
- ZK proofs reales (BN254 + RISC Zero)
- CVM real (NVIDIA TEE)

## 🐛 Troubleshooting

### Backend no inicia
- Verificar que el puerto 5000 no está en uso
- Verificar que las dependencias están instaladas
- Revisar logs: `docker-compose logs backend`

### Frontend no inicia
- Verificar que el puerto 3000 no está en uso
- Verificar que `VITE_API_URL` está configurado
- Revisar logs: `docker-compose logs frontend`

### Tests fallan
- Ejecutar `npm install` en backend
- Verificar que Vitest está instalado

## 📝 Licencia

Proyecto para Stellar Hack + 2025
