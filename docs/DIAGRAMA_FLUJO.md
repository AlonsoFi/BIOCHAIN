# 📊 Diagrama Visual del Flujo Completo

## 🔄 Flujo Contribuyente: Upload de Estudio

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO SUBE PDF                              │
│              frontend/src/pages/user/upload.tsx                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         POST /api/cvm/process (con PDF en FormData)              │
│              frontend/src/lib/api/cvmApi.ts                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND RECIBE PDF (en memoria)                    │
│         backend/src/routes/cvm.routes.ts                         │
│                                                                   │
│  ⚠️ IMPORTANTE: multer.memoryStorage()                          │
│  → El PDF NO se guarda en disco, solo en memoria                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          1️⃣ NVIDIA CVM (Trusted Execution Environment)          │
│         backend/src/services/cvm-gateway.service.ts             │
│                                                                   │
│  📄 Procesa PDF dentro del TEE:                                 │
│     • Hashea el PDF → datasetHash (SHA-256)                      │
│     • Extrae metadata → summaryMetadata                         │
│     • Genera attestation → attestationProof                      │
│                                                                   │
│  🗑️ DESTRUYE el PDF (no se guarda)                              │
│                                                                   │
│  Retorna:                                                        │
│  {                                                               │
│    datasetHash: "abc123...",                                     │
│    summaryMetadata: { age: "25-30", condition: "..." },        │
│    attestationProof: "mock_attestation_xyz..."                   │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          2️⃣ ZK PROVER (Zero-Knowledge Proof)                    │
│         backend/src/services/zkprover.service.ts                │
│                                                                   │
│  🔐 Genera ZK Proof:                                             │
│     • Recibe: datasetHash + attestationProof                     │
│     • Genera: zkProof (prueba sin revelar contenido)             │
│     • Public Inputs: [datasetHash, attestationProof]            │
│                                                                   │
│  ✅ Zero-Knowledge = Prueba validez SIN revelar datos            │
│                                                                   │
│  Retorna:                                                        │
│  {                                                               │
│    proof: "zk_proof_abc123...",                                  │
│    publicInputs: ["datasetHash", "attestationProof"],           │
│    verificationKey: "vk_xyz..."                                  │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND DEVUELVE RESPUESTA COMPLETA                     │
│         backend/src/routes/cvm.routes.ts (línea 51-55)          │
│                                                                   │
│  {                                                               │
│    datasetHash: "abc123...",                                     │
│    summaryMetadata: { ... },                                     │
│    attestationProof: "mock_attestation_xyz...",                  │
│    zkProof: "zk_proof_abc123...",        ← ZK Proof              │
│    publicInputs: ["datasetHash", "attestationProof"]             │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         FRONTEND RECIBE RESPUESTA                                │
│         frontend/src/pages/user/upload.tsx                       │
│                                                                   │
│  ✅ Tiene todo: hash, metadata, attestation, ZK proof            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          3️⃣ REGISTRAR EN BLOCKCHAIN (Soroban)                   │
│         frontend/src/lib/stellar/sorobanClient.ts                │
│                                                                   │
│  register_study(                                                │
│    zkProof,           ← Zero-Knowledge proof                    │
│    attestationProof,  ← Prueba de procesamiento en TEE          │
│    datasetHash,       ← Hash del PDF (no el PDF)                │
│    cycleTimestamp     ← Timestamp del ciclo                     │
│  )                                                               │
│                                                                   │
│  📝 El contrato Soroban guarda:                                  │
│     • study_id (generado)                                        │
│     • dataset_hash (hash, NO el PDF)                             │
│     • contributor_address (wallet del usuario)                   │
│     • cycle_timestamp                                            │
│     • zk_proof (prueba de validez)                               │
│                                                                   │
│  ✅ Estudio registrado en blockchain                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Flujo Investigador: Compra de Dataset

```
┌─────────────────────────────────────────────────────────────────┐
│         INVESTIGADOR VE DATASET EN MARKETPLACE                  │
│         frontend/src/pages/researcher/marketplace.tsx           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         CLICK EN "COMPRAR" → /checkout/:id                      │
│         frontend/src/pages/researcher/checkout.tsx              │
│                                                                   │
│  💳 Métodos de pago:                                             │
│     • Mercado Pago (fiat)                                        │
│     • Transferencia bancaria (fiat)                              │
│     • USDC directo (crypto)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         POST /api/datasets/:id/purchase                         │
│         frontend/src/lib/api/datasetsApi.ts                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND: SEP-24 ANCHOR (Mock)                           │
│         backend/src/routes/datasets.routes.ts                    │
│                                                                   │
│  🔄 Flujo SEP-24:                                                │
│     1. Investigador paga en fiat (pesos, dólares)                │
│     2. Anchor recibe el pago                                     │
│     3. Anchor convierte fiat → USDC                              │
│     4. Anchor deposita USDC en wallet del investigador          │
│                                                                   │
│  ⚠️ Mock: Simula el proceso (no hay anchor real)                 │
│                                                                   │
│  Retorna:                                                        │
│  {                                                               │
│    success: true,                                                │
│    txHash: "mock_tx_...",                                        │
│    accessToken: "access_token_..."                               │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         REGISTRAR COMPRA EN BLOCKCHAIN (Soroban)                │
│         frontend/src/lib/stellar/sorobanClient.ts                │
│                                                                   │
│  purchase_dataset(datasetId)                                    │
│                                                                   │
│  📝 El contrato Soroban:                                         │
│     1. Verifica que el pago USDC fue recibido                    │
│     2. Llama a RevenueSplitter                                   │
│     3. Distribuye:                                                │
│        • 85% → Contribuyentes (repartido entre study_ids)        │
│        • 15% → BioChain Treasury                                 │
│                                                                   │
│  ✅ Compra registrada y pagos distribuidos                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND ENTREGA ACCESS TOKEN                            │
│         backend/src/routes/datasets.routes.ts                    │
│                                                                   │
│  El investigador recibe:                                        │
│  • accessToken: Para descargar/consultar el dataset              │
│  • Confirmación de compra                                        │
│                                                                   │
│  ✅ Investigador puede acceder al dataset                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Zero-Knowledge: ¿Qué se oculta y qué se revela?

### ❌ LO QUE SE OCULTA (Zero-Knowledge):
```
┌─────────────────────────────────────────────────────────┐
│  🔒 DATOS OCULTOS (Nunca se revelan)                    │
├─────────────────────────────────────────────────────────┤
│  ❌ Contenido del PDF original                          │
│  ❌ Datos personales (PII):                             │
│     • Nombre completo                                    │
│     • DNI/pasaporte                                     │
│     • Dirección                                         │
│     • Teléfono                                          │
│  ❌ Información médica específica:                      │
│     • Resultados exactos de laboratorio                 │
│     • Diagnósticos detallados                           │
│     • Tratamientos específicos                          │
│  ❌ Detalles del procesamiento en TEE                   │
└─────────────────────────────────────────────────────────┘
```

### ✅ LO QUE SE REVELA (Public Inputs):
```
┌─────────────────────────────────────────────────────────┐
│  ✅ DATOS PÚBLICOS (Se revelan)                         │
├─────────────────────────────────────────────────────────┤
│  ✅ datasetHash: Hash SHA-256 del PDF                    │
│     → Identifica el archivo sin revelar contenido        │
│                                                          │
│  ✅ attestationProof: Prueba de procesamiento en TEE    │
│     → Garantiza que fue procesado en entorno seguro      │
│                                                          │
│  ✅ Metadata agregada:                                   │
│     • Rango de edad: "25-30" (no edad exacta)           │
│     • Condición: "Diabetes Type 2" (genérico)           │
│     • Población: "Hispanic" (agregado)                   │
│                                                          │
│  ✅ zkProof: Prueba de validez                           │
│     → Demuestra que el estudio es válido                │
│     → Sin revelar el contenido                          │
└─────────────────────────────────────────────────────────┘
```

### 🎯 Ejemplo Práctico:

```
Investigador pregunta: "¿Este estudio es válido?"
┌─────────────────────────────────────────────────────────┐
│  ZK Proof responde: "Sí, es válido" ✅                  │
│                                                          │
│  • El hash coincide con un estudio procesado en TEE      │
│  • El attestation proof es válido                       │
│  • La metadata agregada es correcta                      │
└─────────────────────────────────────────────────────────┘

Investigador pregunta: "¿Qué dice el PDF?"
┌─────────────────────────────────────────────────────────┐
│  ZK Proof responde: "No puedo decírtelo" 🔒              │
│                                                          │
│  • Zero-Knowledge = Prueba sin revelar conocimiento      │
│  • Solo puedes verificar validez, no contenido           │
└─────────────────────────────────────────────────────────┘
```

---

## 📍 Ubicación de Cada Componente

| Componente | Archivo | Línea | Estado |
|------------|---------|-------|--------|
| **Upload UI** | `frontend/src/pages/user/upload.tsx` | 46-99 | ✅ Real |
| **CVM API Call** | `frontend/src/lib/api/cvmApi.ts` | 17-28 | ✅ Real |
| **CVM Route** | `backend/src/routes/cvm.routes.ts` | 36-60 | ✅ Real |
| **NVIDIA CVM Mock** | `backend/src/services/cvm-gateway.service.ts` | 37-64 | 🟡 Mock |
| **ZK Prover Mock** | `backend/src/services/zkprover.service.ts` | 33-58 | 🟡 Mock |
| **Soroban Client** | `frontend/src/lib/stellar/sorobanClient.ts` | - | 🟡 Mock |
| **Checkout UI** | `frontend/src/pages/researcher/checkout.tsx` | 32-54 | ✅ Real |
| **SEP-24 Mock** | `backend/src/routes/datasets.routes.ts` | 46-79 | 🟡 Mock |

**Leyenda**:
- ✅ Real = Implementado y funcional
- 🟡 Mock = Estructura lista, pero simulado para hackathon

---

## 🎯 Resumen del Flujo

1. **Usuario sube PDF** → Frontend
2. **Backend recibe PDF** → En memoria (NO se guarda)
3. **NVIDIA CVM procesa** → Hashea, extrae metadata, destruye PDF
4. **ZK Prover genera proof** → Prueba validez sin revelar contenido
5. **Backend devuelve todo** → Hash, metadata, attestation, ZK proof
6. **Frontend registra en Soroban** → `register_study()` con ZK proof
7. **Estudio en blockchain** → ✅ Listo para vender

**Para Investigador**:
1. **Ve dataset** → Marketplace
2. **Compra** → SEP-24 (fiat → USDC)
3. **Registra en Soroban** → `purchase_dataset()`
4. **Recibe access token** → Puede descargar dataset

---

## ✅ Todo está implementado y documentado

