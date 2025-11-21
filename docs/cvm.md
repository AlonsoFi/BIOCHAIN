# 🔒 NVIDIA CVM Integration - BioChain

## 📋 Resumen

BioChain integra NVIDIA Confidential VM (CVM) para procesar PDFs médicos dentro de un Trusted Execution Environment (TEE), garantizando que la información personal identificable (PII) nunca salga del enclave seguro.

## 🏗️ Arquitectura

### Flujo de Procesamiento

```
Usuario sube PDF
    ↓
Client-side encryption (opcional)
    ↓
POST /api/cvm/process
    ↓
CVM Service Manager (auto-switching)
    ↓
┌─────────────────┬─────────────────┐
│  REAL CVM       │   MOCK CVM      │
│  (NVIDIA TEE)   │   (Desarrollo)  │
└─────────────────┴─────────────────┘
    ↓
Procesamiento dentro del TEE:
  - Elimina PII
  - Extrae biomarkers
  - Genera hash determinístico
  - Genera attestation proof
    ↓
Verificación anti-duplicado
    ↓
Generación ZK Proof
    ↓
Registro en Soroban (blockchain)
```

## 🔐 Modos de Operación

### 1. Modo MOCK (`CVM_MODE=mock`)

**Uso**: Desarrollo y testing

**Características**:
- Simula procesamiento en TEE
- Genera hash determinístico
- Genera attestation proof fake
- No requiere API de NVIDIA

**Archivo**: `backend/src/services/cvm-gateway-mock.service.ts`

### 2. Modo REAL (`CVM_MODE=real`)

**Uso**: Producción

**Características**:
- Procesa PDFs en NVIDIA CVM real
- Elimina PII dentro del TEE
- Genera attestation proof real
- Requiere `CVM_API_URL` y `CVM_API_KEY`

**Archivo**: `backend/src/services/cvm-gateway-real.service.ts`

### 3. Modo AUTO (`CVM_MODE=auto`) - **Recomendado**

**Uso**: Producción con fallback

**Características**:
- Intenta usar CVM real
- Si falla → fallback automático a MOCK
- Logs detallados de fallback
- Mejor para alta disponibilidad

**Archivo**: `backend/src/services/cvm.service.ts`

## 🛑 Anti-Duplicado (Deduplicación)

### Regla Crítica

**Un PDF (estudio) NO puede subirse dos veces.**

### Implementación en 3 Capas

#### Capa A: Dentro del NVIDIA CVM

El CVM genera un **hash determinístico** de los datos limpios:

```typescript
dataset_hash = sha256(normalized_clean_data)
```

**Normalización**:
- Biomarkers en formato JSON lowercase
- Lab info normalizado
- Valores numéricos normalizados
- Fecha de test incluida

#### Capa B: Backend (Verificación Local)

**Archivo**: `backend/src/services/deduplication.service.ts`

**Función**: `hashExists(datasetHash)`

Verifica si el hash ya existe en storage local antes de procesar.

**Storage**: `backend/data/dataset-hashes.json`

#### Capa C: Soroban Contract (On-Chain)

**Archivo**: `frontend/src/lib/stellar/sorobanClient.ts`

**Función**: `checkHashNotRegistered(datasetHash)`

Verifica en blockchain si el hash ya está registrado.

**Contrato**: `StudyRegistry.has_hash(dataset_hash)`

### Flujo Anti-Duplicado

```
1. PDF procesado en CVM → dataset_hash generado
    ↓
2. Backend verifica: hashExists(dataset_hash)
   Si existe → Rechaza (409 Conflict)
    ↓
3. Soroban verifica: checkHashNotRegistered(dataset_hash)
   Si existe → Rechaza (duplicado on-chain)
    ↓
4. Registro exitoso
   - Backend: registerHash(dataset_hash)
   - Soroban: register_study(...)
```

## 🔒 Eliminación de PII

### PII que se Elimina

Dentro del TEE, el CVM elimina:

- ✅ Nombres y apellidos
- ✅ DNI / Pasaporte
- ✅ Direcciones
- ✅ Teléfonos
- ✅ Emails
- ✅ Patient ID
- ✅ Cualquier PII en metadata embebida

### Datos que se Conservan (Anonimizados)

- ✅ Biomarkers (valores numéricos)
- ✅ Rangos de edad (no fecha exacta)
- ✅ Condición médica (agregada)
- ✅ Población (agregada)
- ✅ Info de laboratorio (anonimizada)

## 📝 Attestation Proof

### ¿Qué es?

Una prueba criptográfica que garantiza:

1. El procesamiento ocurrió dentro del TEE
2. No hay PII en los datos de salida
3. Los datos limpios son los que se hashearon
4. El código ejecutado fue la versión aprobada

### Formato

```
attestation_proof = {
  tee_info: "...",
  signature: "...",
  timestamp: "...",
  code_hash: "..."
}
```

### Validación

El backend valida que el attestation proof:
- Tiene formato correcto
- Contiene información del TEE
- Tiene firma criptográfica válida

## 🔧 Configuración

### Variables de Entorno

```env
# Modo de operación
CVM_MODE=auto  # mock | real | auto

# Configuración CVM Real (solo si CVM_MODE=real o auto)
CVM_API_URL=https://your-nvidia-cvm-endpoint.com/api
CVM_API_KEY=your_api_key_here
CVM_TIMEOUT_MS=20000  # Timeout en milisegundos
```

### Ejemplo .env

```env
# Desarrollo (solo mock)
CVM_MODE=mock

# Producción con fallback
CVM_MODE=auto
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=sk_live_...
CVM_TIMEOUT_MS=30000
```

## 📊 Logs y Monitoreo

### Logs de Fallback

Cuando el modo AUTO falla y usa fallback:

```json
{
  "level": "warn",
  "message": "CVM AUTO: REAL CVM failed, falling back to MOCK",
  "errorCode": "TIMEOUT",
  "errorMessage": "CVM request timeout",
  "reason": "CVM request timeout",
  "timestamp": "2025-01-21T10:30:00Z",
  "attemptedReal": true,
  "fallbackUsed": true
}
```

### Métricas Importantes

- Tasa de éxito de CVM real
- Tasa de fallback
- Tiempo de procesamiento
- Errores por tipo (TIMEOUT, QUOTA, etc.)

## 🧪 Testing

### Tests Unitarios

**Archivo**: `backend/src/tests/cvm.service.test.ts`

Cubre:
- ✅ Modo mock
- ✅ Modo real (con mock server)
- ✅ Auto fallback
- ✅ Timeout fallback
- ✅ Quota error fallback
- ✅ Deduplicación
- ✅ Secure buffer wipe

### Ejecutar Tests

```bash
cd backend
npm test cvm.service.test.ts
```

## 🚨 Manejo de Errores

### Códigos de Error

| Código | Descripción | Acción |
|--------|-------------|--------|
| `TIMEOUT` | Request timeout | Fallback a MOCK (si auto) |
| `QUOTA` | Quota exceeded | Fallback a MOCK (si auto) |
| `INVALID_ATTESTATION` | Attestation inválido | Rechazar |
| `MALFORMED_RESPONSE` | Respuesta malformada | Rechazar |
| `NETWORK_ERROR` | Error de red | Fallback a MOCK (si auto) |

### Respuestas HTTP

- `200 OK`: Procesamiento exitoso
- `409 Conflict`: Duplicado detectado
- `503 Service Unavailable`: CVM no disponible (con fallback)
- `500 Internal Server Error`: Error interno

## 🔄 Flujo Completo de Upload

```
1. Usuario sube PDF
   POST /api/cvm/process
   Content-Type: multipart/form-data
   
2. Backend recibe PDF en memoria
   (NO se guarda en disco)
   
3. CVM Service procesa:
   - Modo AUTO: Intenta REAL → Fallback a MOCK si falla
   - Modo REAL: Solo REAL (falla si no disponible)
   - Modo MOCK: Solo MOCK
   
4. CVM elimina PII y genera:
   - dataset_hash (determinístico)
   - summary_metadata
   - attestation_proof
   
5. Verificación anti-duplicado:
   - Backend: hashExists() → Si existe, rechaza
   - Soroban: checkHashNotRegistered() → Si existe, rechaza
   
6. Generación ZK Proof
   
7. Registro:
   - Backend: registerHash()
   - Soroban: register_study()
   
8. Destrucción del buffer:
   - buffer.fill(0) → Sobreescribe con ceros
   
9. Respuesta al cliente:
   {
     datasetHash,
     summaryMetadata,
     attestationProof,
     zkProof,
     mode: "real" | "mock",
     duplicateCheck: "passed"
   }
```

## 📚 Referencias

- [NVIDIA Confidential Computing](https://www.nvidia.com/en-us/data-center/products/confidential-computing/)
- [Trusted Execution Environment (TEE)](https://en.wikipedia.org/wiki/Trusted_execution_environment)
- [Zero-Knowledge Proofs](./FLUJO_NVIDIA_ZK_ANCHOR.md)

## 🔍 Ejemplo de Logs Real

```
[2025-01-21 10:30:00] [info] Processing file in CVM {
  "filename": "lab_results.pdf",
  "size": 245760,
  "mimetype": "application/pdf"
}

[2025-01-21 10:30:00] [info] CVM Mode: AUTO (try real, fallback to mock)

[2025-01-21 10:30:02] [info] NVIDIA CVM processing completed {
  "datasetHash": "a1b2c3d4e5f6...",
  "duration": "2150ms",
  "mode": "real"
}

[2025-01-21 10:30:02] [info] CVM processing completed {
  "datasetHash": "a1b2c3d4e5f6...",
  "mode": "real",
  "fallbackUsed": false
}

[2025-01-21 10:30:02] [info] Dataset hash registered {
  "hash": "a1b2c3d4e5f6...",
  "totalHashes": 42
}
```


