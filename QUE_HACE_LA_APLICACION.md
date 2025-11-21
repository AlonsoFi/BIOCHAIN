# 🧬 BioChain - ¿Qué hace la aplicación?

## 📱 FLUJO COMPLETO DE LA APLICACIÓN

### 🏠 LANDING PAGE
**URL**: `/`

**Qué hace**:
- Página de inicio con información del producto
- Botones para "Soy Usuario" o "Soy Investigador"
- Explica cómo funciona BioChain
- Diseño con gradientes y cards informativos

**Tecnologías**:
- React + TypeScript
- TailwindCSS
- Routing con React Router

---

### 🔐 LOGIN
**URL**: `/login`

**Qué hace**:
- Permite login con Google OAuth
- **Account Abstraction**: Usa SDK de Hoblayerta (mock por ahora)
- Genera wallet Stellar automáticamente
- Guarda wallet en estado global (Zustand + localStorage)
- Redirige según tipo de usuario (contributor o researcher)

**Tecnologías Stellar**:
- SDK Hoblayerta (estructura lista, mock funcional)
- Genera Keypair de Stellar
- Guarda dirección en estado

**Buenas prácticas**:
- ✅ No manipula DOM directamente
- ✅ Estado persistente
- ✅ Manejo de errores

---

### 👤 FLUJO USUARIO (CONTRIBUYENTE)

#### 1. Historia Clínica
**URL**: `/user/historia-clinica`

**Qué hace**:
- Form multi-step de 4 pasos:
  1. **Datos básicos**: Año nacimiento, sexo, país, ciudad, etnia
  2. **Salud reproductiva**: Anticonceptivos (tipo, marca, tiempo de uso)
  3. **Condiciones médicas**: SOP, diabetes, hipertensión, etc. (agrupadas)
  4. **Consentimiento**: Términos y condiciones con diseño especial

**Proceso**:
1. Usuario completa cada paso
2. Progress bar visual con círculos numerados
3. Al finalizar, llama a `POST /api/user/history`
4. Backend guarda datos anonimizados (NO guarda datos identificables)
5. Redirige a dashboard

**Tecnologías**:
- React hooks (useState)
- Progress bar custom component
- API REST al backend
- Validación de formularios

**Buenas prácticas**:
- ✅ NO guarda datos personales identificables
- ✅ Anonimización en backend
- ✅ Validación de campos
- ✅ UX clara con progress bar

---

#### 2. Dashboard Usuario
**URL**: `/user/dashboard`

**Qué hace**:
- Muestra 6 tabs: Inicio, Cargar estudios, Mis estudios, Wallet, Historia clínica, Configuración

**Tab "Inicio"**:
- Header con gradiente violeta
- 4 Stats Cards: Estudios subidos, Datasets vendidos, Total ganado, Balance
- Quick Actions: Cards clickeables para acciones rápidas
- Actividad reciente: Lista de transacciones con iconos y montos

**Tab "Cargar estudios"**:
- Link a página de upload

**Tab "Mis estudios"**:
- Lista de estudios con:
  - Nombre del estudio
  - Fecha
  - Número de ventas
  - Ganancias
- Cards visuales con iconos

**Tab "Wallet"**:
- Balance grande con gradiente naranja
- Dirección Stellar completa
- Botones de retirar/fondear
- Historial de transacciones

**Tab "Historia clínica"**:
- Link para editar historia clínica

**Tab "Configuración"**:
- Notificaciones
- Seguridad
- Zona de peligro

**Tecnologías**:
- React state management
- Componentes UI reutilizables
- API calls para datos

---

#### 3. Upload de Estudios
**URL**: `/user/upload`

**Qué hace**:
1. **Drag & Drop**: Usuario arrastra PDF o selecciona archivo
2. **Procesamiento**:
   - Muestra estados: "Procesando en NVIDIA CVM (TEE)..."
   - Llamada a `POST /api/cvm/process`
   - Backend procesa archivo (mock CVM):
     - Genera `dataset_hash` (SHA256 del archivo)
     - Genera `summary_metadata` (mock: edad, condición, población)
     - Genera `attestation_proof` (mock del TEE)
   - Backend genera ZK proof (mock)
   - Devuelve: `{datasetHash, summaryMetadata, attestationProof, zkProof}`
3. **Registro en Blockchain**:
   - Frontend llama a `registerStudy()` en Soroban
   - Por ahora es mock (simula transacción)
   - Devuelve `txHash` mock
4. **Lista de archivos**: Muestra archivos subidos con estados

**Flujo técnico**:
```
Usuario sube PDF
  ↓
Frontend: FormData → POST /api/cvm/process
  ↓
Backend: processStudyFile() (mock CVM)
  - Genera hash
  - Genera metadata fake
  - Genera attestation fake
  - NO guarda el PDF (solo procesa)
  ↓
Backend: generateProof() (mock ZK)
  - Genera zk_proof fake
  ↓
Backend devuelve: {datasetHash, metadata, attestation, zkProof}
  ↓
Frontend: registerStudy() en Soroban (mock)
  - Simula transacción
  - Devuelve txHash mock
  ↓
Muestra resultado al usuario
```

**Tecnologías**:
- Multer (upload de archivos en backend)
- CVM Gateway Service (mock NVIDIA TEE)
- ZK Prover Service (mock)
- Soroban Client (mock transacciones)

**Buenas prácticas**:
- ✅ **NO guarda PDFs** (solo procesa y descarta)
- ✅ Muestra estados de carga claros
- ✅ Manejo de errores
- ✅ Lista de archivos procesados

---

### 🔬 FLUJO INVESTIGADOR

#### 1. Dashboard Investigador
**URL**: `/researcher/dashboard`

**Qué hace**:
- Asistente IA con input de búsqueda
- Chips de sugerencias clickeables
- Link al marketplace
- Sidebar con navegación

**Tecnologías**:
- React state
- Filtrado básico (mock, lista para IA real)

---

#### 2. Marketplace
**URL**: `/researcher/marketplace`

**Qué hace**:
- Muestra lista de datasets disponibles
- Cards con:
  - ID del dataset
  - Badge "Verificado"
  - Nombre y descripción
  - Tags
  - Metadata (análisis, fecha, síntomas, ubicación)
  - Precio
  - Botón "Ver detalles"
- Búsqueda con asistente IA (mock)

**Proceso**:
1. Carga datasets de `GET /api/datasets`
2. Muestra en grid de cards
3. Click en "Ver detalles" → va a página de detalle

**Tecnologías**:
- API REST
- Componentes UI
- Filtrado local (mock)

---

#### 3. Detalle Dataset
**URL**: `/researcher/dataset/:id`

**Qué hace**:
- Vista completa del dataset:
  - Header con badges (Verificado, Premium)
  - Perfil demográfico (edad, sexo, ubicación, etnia)
  - Salud reproductiva (anticonceptivos, marca, tiempo)
  - Condiciones médicas (tags)
  - Análisis de sangre (preview con valores ocultos)
  - Síntomas con barras de severidad
  - Estilo de vida
- Card de compra lateral:
  - Precio
  - Beneficios
  - Botón "Comprar acceso"
  - Info de compliance

**Proceso**:
1. Carga dataset de `GET /api/datasets/:id`
2. Muestra toda la información
3. Click en "Comprar" → va a checkout

**Tecnologías**:
- React Router (params)
- API REST
- Componentes visuales

---

#### 4. Checkout
**URL**: `/researcher/checkout/:id`

**Qué hace**:
- Muestra info de wallet del investigador
- 3 métodos de pago:
  1. **Mercado Pago**: Info SEP-24, redirección a MP
  2. **Transferencia**: Datos bancarios (CBU, alias, referencia)
  3. **USDC directo**: Dirección Stellar + memo
- Summary lateral:
  - Resumen de compra
  - Precio total
  - Campo de propósito de investigación
  - Info de compliance
- Al confirmar:
  1. Llama a `POST /api/datasets/:id/purchase`
  2. Backend simula compra (mock SEP-24)
  3. Llama a `purchaseDataset()` en Soroban (mock)
  4. Muestra confirmación

**Flujo técnico**:
```
Investigador confirma compra
  ↓
Frontend: POST /api/datasets/:id/purchase
  ↓
Backend: Simula pago (mock SEP-24)
  - Genera txHash mock
  - Genera accessToken mock
  ↓
Frontend: purchaseDataset() en Soroban (mock)
  - Simula transacción
  ↓
Muestra confirmación
```

**Tecnologías**:
- SEP-24 (concepto, mock por ahora)
- Soroban Client (mock)
- API REST

**Buenas prácticas**:
- ✅ Validación de propósito de investigación
- ✅ Info de compliance visible
- ✅ Múltiples métodos de pago

---

## 🔧 BACKEND - ¿Qué hace?

### Servicios:

#### 1. User Service
- Guarda historia clínica anonimizada
- NO guarda datos identificables
- Mapeo user ↔ wallet

#### 2. CVM Gateway Service
- Recibe PDF
- **NO lo guarda** (solo procesa en memoria)
- Genera hash (SHA256)
- Genera metadata fake
- Genera attestation fake
- Devuelve resultado y descarta archivo

#### 3. ZK Prover Service
- Recibe dataset_hash y attestation
- Genera ZK proof fake
- Devuelve proof + public inputs

#### 4. Dataset Aggregator Service
- Agrupa estudios en datasets
- Lista datasets para marketplace
- Datos en memoria (mock)

---

## ⛓️ SMART CONTRACTS - ¿Qué hacen?

### 1. StudyRegistry
**Función**: `register_study()`

**Qué hace**:
- Recibe: zk_proof, attestation, dataset_hash, cycle_timestamp
- Valida que no haya duplicados en el ciclo
- Guarda StudyRecord en blockchain
- Emite evento `StudyRegistered`

**Estado actual**: ✅ Estructura correcta, validación mock

### 2. DatasetMarketplace
**Función**: `purchase_dataset()`

**Qué hace**:
- Recibe: dataset_id
- Verifica que el dataset existe
- Llama a RevenueSplitter para distribuir pagos
- Crea PurchaseRecord
- Emite evento `DatasetPurchased`

**Estado actual**: ✅ Estructura correcta, no valida pago real

### 3. RevenueSplitter
**Función**: `split_revenue()`

**Qué hace**:
- Recibe: dataset_id, amount_usdc, study_ids[]
- Calcula: 85% contributors, 15% treasury
- Distribuye pagos (por ahora solo emite eventos)
- Emite eventos de transferencia

**Estado actual**: ✅ Estructura correcta, no transfiere USDC real

---

## 🎯 ANÁLISIS STELLAR - Buenas Prácticas

### ✅ LO QUE ESTÁ BIEN:

1. **Arquitectura**:
   - ✅ Separación frontend/backend/contracts
   - ✅ Servicios separados
   - ✅ API REST bien estructurada

2. **Seguridad**:
   - ✅ NO guarda PDFs
   - ✅ Anonimización de datos
   - ✅ Validación de archivos

3. **Stellar/Soroban**:
   - ✅ Cliente Soroban configurado
   - ✅ Contratos con estructura correcta
   - ✅ Account Abstraction preparado

4. **React**:
   - ✅ Hooks correctos
   - ✅ No manipulación DOM
   - ✅ Routing correcto

### ⚠️ LO QUE ES MOCK (OK para hackathon):

1. **Transacciones Soroban**: Mock (simula, no firma real)
2. **Pagos USDC**: Mock (no valida ni transfiere real)
3. **ZK Proofs**: Mock (estructura correcta, no proof real)
4. **CVM**: Mock (no llama a NVIDIA real)
5. **Account Abstraction**: Mock (estructura lista para SDK real)

### 🔴 LO QUE FALTA PARA PRODUCCIÓN:

1. Firmar transacciones reales en Soroban
2. Validar pagos USDC en contratos
3. Transferencias USDC reales
4. ZK proofs reales (BN254 + RISC Zero)
5. CVM real (NVIDIA TEE)
6. SDK Hoblayerta real

---

## 📊 RESUMEN EJECUTIVO

**La aplicación hace**:
1. ✅ Permite a usuarios compartir datos médicos anonimizados
2. ✅ Procesa PDFs en CVM (mock) sin guardarlos
3. ✅ Genera ZK proofs (mock) para validación
4. ✅ Registra estudios en blockchain (Soroban mock)
5. ✅ Permite a investigadores comprar datasets
6. ✅ Distribuye pagos automáticamente (mock)

**Estado técnico**:
- ✅ Arquitectura correcta
- ✅ Diseño completo y funcional
- ✅ Flujo end-to-end implementado
- ⚠️ Integraciones reales mockeadas (OK para hackathon)

**Para hackathon**: ✅ **LISTO y FUNCIONAL**

**Para producción**: Necesita integraciones reales mencionadas arriba.

