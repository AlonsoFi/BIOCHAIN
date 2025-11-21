# 🔐 Flujo Completo: NVIDIA CVM → ZK Proof → Soroban

## 📍 Dónde está cada componente

### 1. **NVIDIA CVM (Confidential VM / TEE)**

**Ubicación**: `backend/src/services/cvm-gateway.service.ts`

**¿Qué hace?**
- Recibe el PDF del usuario (en memoria, NO se guarda)
- Procesa el PDF dentro de un Trusted Execution Environment (TEE)
- Genera un **hash del archivo** (`datasetHash`)
- Extrae metadata anonimizada (edad, condición, población)
- Genera un **attestation proof** (prueba de que el procesamiento fue en TEE)
- **DESTRUYE el PDF** (nunca se almacena)

**Código actual (mock)**:
```typescript
// backend/src/services/cvm-gateway.service.ts
export const processStudyFile = async (fileBuffer: Buffer) => {
  // 1. Hash del archivo (SHA-256)
  const datasetHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
  
  // 2. Metadata extraída (mock)
  const summaryMetadata = {
    age: '25-30',
    condition: 'Diabetes Type 2',
    population: 'Hispanic',
  }
  
  // 3. Attestation proof del TEE
  const attestationProof = `mock_attestation_${crypto.randomBytes(16).toString('hex')}`
  
  // 4. El archivo se descarta aquí (NO se guarda)
  return { datasetHash, summaryMetadata, attestationProof }
}
```

**En producción**: Se comunicaría con un NVIDIA CVM real que procesa dentro de un enclave seguro.

---

### 2. **Zero-Knowledge Proof (ZK)**

**Ubicación**: `backend/src/services/zkprover.service.ts`

**¿Qué hace?**
- Recibe el `datasetHash` y `attestationProof` del CVM
- Genera una **ZK proof** que prueba:
  - ✅ El hash es válido (sin revelar el contenido del PDF)
  - ✅ El attestation proof es válido (sin revelar detalles del TEE)
  - ✅ El procesamiento fue correcto (sin mostrar los datos originales)

**¿Por qué Zero-Knowledge?**
- **Zero-Knowledge** = "Prueba sin revelar conocimiento"
- El investigador puede verificar que el estudio es válido **sin ver el PDF original**
- Solo se revela el hash y metadata agregada, nunca PII (Personally Identifiable Information)

**Código actual (mock)**:
```typescript
// backend/src/services/zkprover.service.ts
export const generateProof = async (datasetHash: string, attestationProof: string) => {
  // Mock de ZK proof
  // En producción: usaría BN254 (curva elíptica) + RISC Zero verifier
  const proof = `zk_proof_${datasetHash.slice(0, 16)}_${attestationProof.slice(0, 16)}`
  
  // Public inputs (lo que SÍ se revela)
  const publicInputs = [datasetHash, attestationProof]
  
  return { proof, publicInputs, verificationKey }
}
```

**Stack real (para producción)**:
- **BN254**: Curva elíptica para generar la proof
- **RISC Zero**: Verificador de la proof

---

### 3. **SEP-24 Anchor (Pago Fiat → USDC)**

**Ubicación**: `backend/src/routes/datasets.routes.ts` (línea 46-79)

**¿Qué hace?**
- Permite que investigadores paguen con **fiat** (pesos, dólares, etc.)
- El anchor convierte automáticamente a **USDC** en Stellar
- El pago se registra en blockchain

**Flujo SEP-24**:
1. Investigador elige método de pago (Mercado Pago, Transferencia, etc.)
2. Paga en fiat
3. Anchor recibe el pago
4. Anchor convierte fiat → USDC
5. Deposita USDC en la wallet del investigador
6. El investigador puede comprar el dataset

**Código actual (mock)**:
```typescript
// backend/src/routes/datasets.routes.ts
router.post('/:id/purchase', async (req, res) => {
  // TODO: En producción:
  // 1. Verificar pago vía SEP-24 anchor (fiat → USDC)
  // 2. Llamar a purchase_dataset() en Soroban
  // 3. El contrato distribuye 85% contributors / 15% BioChain
  
  // Mock por ahora
  const txHash = `mock_tx_${Date.now()}`
  res.json({ success: true, txHash, accessToken: '...' })
})
```

**Frontend**: `frontend/src/pages/researcher/checkout.tsx` muestra la UI de pago con explicación de SEP-24.

---

## 🔄 Flujo Completo End-to-End

### **Flujo Contribuyente (Upload Estudio)**

```
1. Usuario sube PDF
   ↓
2. Frontend → POST /api/cvm/process (con PDF)
   ↓
3. Backend recibe PDF (en memoria, NO guarda)
   ↓
4. CVM Gateway procesa:
   - Hashea el PDF → datasetHash
   - Extrae metadata → summaryMetadata
   - Genera attestation → attestationProof
   - DESTRUYE el PDF (no se guarda)
   ↓
5. ZK Prover genera proof:
   - Recibe datasetHash + attestationProof
   - Genera ZK proof (prueba sin revelar contenido)
   ↓
6. Backend devuelve:
   {
     datasetHash,
     summaryMetadata,
     attestationProof,
     zkProof,
     publicInputs
   }
   ↓
7. Frontend llama a Soroban:
   register_study(zkProof, attestationProof, datasetHash, cycleTimestamp)
   ↓
8. Estudio registrado en blockchain ✅
```

**Archivos involucrados**:
- `frontend/src/pages/user/upload.tsx` (línea 46-99)
- `backend/src/routes/cvm.routes.ts` (línea 36-60)
- `backend/src/services/cvm-gateway.service.ts` (línea 37-64)
- `backend/src/services/zkprover.service.ts` (línea 33-58)
- `frontend/src/lib/stellar/sorobanClient.ts` (registerStudy)

---

### **Flujo Investigador (Compra Dataset)**

```
1. Investigador ve dataset en marketplace
   ↓
2. Click en "Comprar" → va a /checkout
   ↓
3. Elige método de pago (Mercado Pago, Transferencia, USDC)
   ↓
4. Frontend → POST /api/datasets/:id/purchase
   ↓
5. Backend (mock SEP-24):
   - Verifica pago (mock)
   - Genera access token
   ↓
6. Frontend llama a Soroban:
   purchase_dataset(datasetId)
   ↓
7. Contrato Soroban:
   - Verifica pago USDC
   - Distribuye 85% a contribuyentes
   - Distribuye 15% a BioChain treasury
   ↓
8. Backend entrega access token para descargar dataset ✅
```

**Archivos involucrados**:
- `frontend/src/pages/researcher/checkout.tsx` (línea 32-54)
- `backend/src/routes/datasets.routes.ts` (línea 46-79)
- `frontend/src/lib/stellar/sorobanClient.ts` (purchaseDataset)

---

## 🔒 Zero-Knowledge: ¿Qué se oculta y qué se revela?

### **Lo que se OCULTA (Zero-Knowledge)**:
- ❌ Contenido del PDF original
- ❌ Datos personales (PII)
- ❌ Detalles del procesamiento en TEE
- ❌ Información médica específica

### **Lo que se REVELA (Public Inputs)**:
- ✅ `datasetHash` (hash del archivo)
- ✅ `attestationProof` (prueba de procesamiento en TEE)
- ✅ Metadata agregada (edad rango, condición, población)
- ✅ ZK proof (prueba de validez sin revelar contenido)

**Ejemplo**:
```
Investigador pregunta: "¿Este estudio es válido?"
ZK Proof responde: "Sí, es válido" ✅
Investigador pregunta: "¿Qué dice el PDF?"
ZK Proof responde: "No puedo decírtelo (zero-knowledge)" 🔒
```

---

## 📊 Resumen de Componentes

| Componente | Ubicación | Estado | ¿Qué hace? |
|------------|-----------|--------|------------|
| **NVIDIA CVM** | `backend/src/services/cvm-gateway.service.ts` | Mock | Hashea PDF, extrae metadata, genera attestation |
| **ZK Prover** | `backend/src/services/zkprover.service.ts` | Mock | Genera proof que valida hash sin revelar contenido |
| **SEP-24 Anchor** | `backend/src/routes/datasets.routes.ts` | Mock | Convierte fiat → USDC (mock) |
| **Soroban Client** | `frontend/src/lib/stellar/sorobanClient.ts` | Mock | Llama a contratos (mock) |
| **Upload Flow** | `frontend/src/pages/user/upload.tsx` | ✅ Real | UI completa del flujo |

---

## 🎯 Para Producción (Después del Hackathon)

### **NVIDIA CVM Real**:
```typescript
// En lugar de mock, llamar a API real de NVIDIA
const response = await fetch('https://nvidia-cvm-api.com/process', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: encryptedFileBuffer
})
```

### **ZK Prover Real**:
```typescript
// Usar BN254 + RISC Zero
import { generateProof } from '@risc-zero/zk'
const proof = await generateProof({
  datasetHash,
  attestationProof,
  curve: 'bn254'
})
```

### **SEP-24 Anchor Real**:
```typescript
// Integrar con anchor real (ej: Stellarport, Lobstr)
import { SEP24Client } from '@stellar/anchor-sdk'
const anchor = new SEP24Client('https://anchor.example.com')
const transaction = await anchor.deposit({ amount: '100', asset: 'USDC' })
```

---

## ✅ Resumen Final

1. **NVIDIA CVM**: Hashea el PDF y lo destruye (no se guarda)
2. **ZK Proof**: Prueba que el hash es válido sin revelar el contenido (zero-knowledge)
3. **SEP-24 Anchor**: Convierte fiat → USDC para pagos
4. **Soroban**: Registra estudios y distribuye pagos en blockchain

**Todo está implementado como mock para el hackathon, pero la estructura está lista para integraciones reales.**

