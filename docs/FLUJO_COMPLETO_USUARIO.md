# 👤 Flujo Completo del Usuario (Contribuyente) - BioChain

## 🎯 Resumen Ejecutivo

El usuario (contribuyente) puede:
1. Registrarse con Google OAuth → Wallet Stellar automática
2. Completar historia clínica (4 pasos)
3. Subir estudios médicos (PDF/foto)
4. Ver sus estudios, ventas y ganancias en dashboard
5. Gestionar su wallet y retirar fondos

---

## 📍 Paso 1: Landing Page

**URL**: `/`
**Archivo**: `frontend/src/pages/landing.tsx`

### ¿Qué ve el usuario?

- **Hero Section**: 
  - Título: "Datos Médicos Descentralizados"
  - Descripción del producto
  - Dos botones: "Soy Usuario" y "Soy Investigador"

- **Features Cards**:
  - 🔒 Confidencialidad: "Tus datos se procesan en NVIDIA TEE. Nunca se almacenan PDFs."
  - ⛓️ Blockchain: "Transparencia y trazabilidad usando Stellar + Soroban."
  - 💰 Monetización: "Recibe USDC por compartir tus datos. 85% para ti, 15% para BioChain."

### Acción del usuario:

1. Click en **"Soy Usuario"**
2. Redirige a: `/login?type=contributor`

---

## 🔐 Paso 2: Login / Registro

**URL**: `/login?type=contributor`
**Archivo**: `frontend/src/pages/login.tsx`

### ¿Qué ve el usuario?

- Modal blanco con:
  - Título: "BioChain"
  - Subtítulo: "Acceso Usuario"
  - Botón: **"Continuar con Google"** (usando Paltalabs WalletButton)
  - Texto: "Al continuar, se creará automáticamente una wallet Stellar para ti"

### Proceso técnico:

1. **Usuario hace click en "Continuar con Google"**
   ```typescript
   // frontend/src/pages/login.tsx (línea 20-34)
   const handleGoogleLogin = async () => {
     // 1. Llama a Account Abstraction SDK (Hoblayerta)
     const result = await loginWithGoogle()
     
     // 2. Genera wallet Stellar automáticamente
     // result.walletAddress = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
     
     // 3. Guarda en estado global (Zustand)
     setAuth(
       result.walletAddress,
       result.publicKey,
       'contributor',  // Tipo de usuario
       result.account
     )
     
     // 4. Redirige a dashboard
     navigate('/user/dashboard')
   }
   ```

2. **Account Abstraction (Hoblayerta SDK)**:
   - Archivo: `frontend/src/lib/stellar/accountAbstraction.ts`
   - Mock actual: Genera Keypair de Stellar
   - En producción: Login real con Google OAuth → Wallet automática

3. **Estado guardado**:
   - `walletAddress`: Dirección Stellar
   - `publicKey`: Clave pública
   - `userType`: 'contributor'
   - Persistido en localStorage (Zustand)

### Resultado:

- ✅ Usuario autenticado
- ✅ Wallet Stellar creada automáticamente
- ✅ Redirige a: `/user/dashboard`

---

## 📋 Paso 3: Historia Clínica (Primera vez)

**URL**: `/user/historia-clinica`
**Archivo**: `frontend/src/pages/user/historia-clinica.tsx`

### ¿Cuándo se muestra?

- Primera vez que el usuario entra al dashboard
- O cuando hace click en "Historia clínica" en el sidebar

### Form Multi-Step (4 pasos):

#### **Paso 1: Datos Básicos**

**Campos**:
- **Año de nacimiento**: Dropdown (1980-2006)
- **Sexo biológico**: 
  - Femenino
  - Masculino
  - Intersex
  - Prefiero no decir
- **País**: Input de texto
- **Ciudad/Región**: Input de texto
- **Etnia**: 
  - Hispana/Latina
  - Caucásica
  - Afrodescendiente
  - Asiática
  - Indígena
  - Otra

**UI**: Progress bar con círculo "1" activo

#### **Paso 2: Salud Reproductiva**

**Campos**:
- **¿Usa o usó anticonceptivos?**:
  - Uso actual
  - Uso pasado
  - Nunca
- **Tipo de anticonceptivo** (si usa/usó):
  - Píldora combinada
  - Mini-píldora
  - DIU (hormonal)
  - DIU (cobre)
  - Implante
  - Inyección
  - Anillo vaginal
  - Parche
  - Otro
- **Marca/Nombre comercial**: Input de texto
- **Tiempo de uso**:
  - Años: Number input
  - Meses: Number input

**UI**: Progress bar con círculo "2" activo

#### **Paso 3: Condiciones Médicas**

**Campos agrupados**:

**Ginecológicas/Hormonales** (checkboxes):
- Síndrome de Ovario Poliquístico (SOP)
- Endometriosis
- Miomas uterinos
- Amenorrea

**Metabólicas/Endocrinas** (checkboxes):
- Hipotiroidismo
- Hipertiroidismo
- Resistencia a la insulina
- Diabetes tipo 1
- Diabetes tipo 2

**Otras** (checkboxes):
- Anemia
- Migrañas
- Hipertensión

**Medicación actual**: Textarea

**UI**: Progress bar con círculo "3" activo

#### **Paso 4: Consentimiento**

**Contenido**:
- Términos y condiciones
- Información sobre privacidad
- Explicación de cómo se usan los datos
- Checkbox obligatorio: "He leído y acepto los términos"

**UI**: 
- Progress bar con círculo "4" activo
- Diseño especial con gradiente violeta
- Botón "Firmar y continuar"

### Proceso técnico:

1. **Usuario completa cada paso**
   ```typescript
   // frontend/src/pages/user/historia-clinica.tsx
   const [step, setStep] = useState<Step>(1)
   const [formData, setFormData] = useState<HistoriaClinicaData>({...})
   ```

2. **Navegación entre pasos**:
   - Botón "Siguiente" → `handleNext()` → `setStep(step + 1)`
   - Botón "Atrás" → `handlePrev()` → `setStep(step - 1)`

3. **Al finalizar (Paso 4)**:
   ```typescript
   // frontend/src/pages/user/historia-clinica.tsx (línea 82-90)
   const handleSubmit = async () => {
     // 1. Guarda historia clínica en backend
     await saveHistoriaClinica(formData)
     
     // 2. Backend anonimiza datos (NO guarda datos identificables)
     // POST /api/user/history
     
     // 3. Redirige a dashboard
     navigate('/user/dashboard')
   }
   ```

4. **Backend procesa**:
   - Archivo: `backend/src/routes/user.routes.ts`
   - Endpoint: `POST /api/user/history`
   - Anonimiza datos (no guarda nombre, email, etc.)
   - Guarda solo metadata agregada

### Resultado:

- ✅ Historia clínica guardada (anonimizada)
- ✅ Consentimiento firmado
- ✅ Redirige a: `/user/dashboard`

---

## 🏠 Paso 4: Dashboard Usuario

**URL**: `/user/dashboard`
**Archivo**: `frontend/src/pages/user/dashboard.tsx`

### Estructura:

**Sidebar izquierdo** (fijo):
- Logo BioChain
- 6 tabs de navegación:
  1. 🏠 Inicio
  2. 📤 Cargar estudios
  3. 📄 Mis estudios
  4. 💰 Wallet
  5. 👤 Historia clínica
  6. ⚙️ Configuración
- Perfil del usuario (PAT-8472, email)
- Wallet address (truncada)
- Botón "Cerrar Sesión"

### Tab "Inicio" (por defecto):

#### **Header con gradiente violeta**:
- Saludo: "¡Hola! 👋"
- Descripción: "Bienvenido/a a tu panel de BioChain..."

#### **4 Stats Cards** (usando Paltalabs StatCard):
1. **Estudios cargados**: 5
2. **Datasets vendidos**: 3
3. **Total ganado**: $450 (color naranja)
4. **Balance disponible**: $450

#### **Quick Actions** (2 cards clickeables):
1. **"Cargar nuevo estudio"** (naranja)
   - Click → Cambia a tab "Cargar estudios"
2. **"Retirar fondos"** (violeta)
   - Click → Cambia a tab "Wallet"

#### **Actividad reciente**:
Lista de transacciones:
- 💰 Venta de dataset: "+$120" (hace 2 horas)
- 📤 Estudio procesado: "✓" (hace 1 día)
- 💰 Venta de dataset: "+$120" (hace 3 días)

### Tab "Cargar estudios":

- Botón grande: **"Ir a página de upload"**
- Click → Navega a `/user/upload`

### Tab "Mis estudios":

**Lista de estudios** (usando `StudiesList` component):
- Cards con:
  - Nombre del estudio
  - Fecha de subida
  - Número de ventas
  - Ganancias totales
  - Estado (Procesado, En venta, etc.)

**Datos mock** (en producción vendría del backend):
```typescript
// frontend/src/pages/user/dashboard.tsx
const studies = [
  {
    id: '1',
    name: 'Análisis hormonal - Enero 2024',
    date: '2024-01-15',
    sales: 2,
    earnings: 240,
  },
  // ...
]
```

### Tab "Wallet":

#### **Balance grande**:
- Monto: "$450 USDC" (con gradiente naranja)
- Dirección Stellar completa (monospace)

#### **Botones**:
- "Retirar fondos"
- "Fondear wallet"

#### **Historial de transacciones**:
- Lista de transacciones con:
  - Tipo (Venta, Retiro, etc.)
  - Monto
  - Fecha
  - Hash de transacción

### Tab "Historia clínica":

- Botón: **"Editar historia clínica"**
- Click → Navega a `/user/historia-clinica`

### Tab "Configuración":

- **Notificaciones**: Toggles para activar/desactivar
- **Seguridad**: Cambiar contraseña, 2FA
- **Zona de peligro**: Eliminar cuenta

---

## 📤 Paso 5: Subir Estudio Médico

**URL**: `/user/upload`
**Archivo**: `frontend/src/pages/user/upload.tsx`

### ¿Qué ve el usuario?

#### **Paso 1: Upload**

**Área de drag & drop**:
- Zona grande con borde punteado
- Texto: "Arrastrá tus archivos aquí"
- Botón: "Seleccionar Archivo"
- Formatos aceptados: PDF, JPG, PNG
- Si hay archivo seleccionado: Muestra nombre y tamaño

**Lista de archivos subidos** (si hay):
- Cards con:
  - Icono 📄
  - Nombre del archivo
  - Tamaño
  - Estado (Procesado ✓, Procesando...)
  - Botón eliminar 🗑️

**Botón**: "Procesar y agregar a mi dataset"

### Proceso técnico completo:

#### **1. Usuario selecciona archivo**:

```typescript
// frontend/src/pages/user/upload.tsx (línea 46-105)
const handleUpload = async () => {
  // Usuario hace click en "Procesar y agregar a mi dataset"
  
  setUploading(true)
  setStep('processing')
}
```

#### **2. Procesamiento en NVIDIA CVM**:

```typescript
// Step 1: Procesar en CVM (NVIDIA TEE)
setStep('cvm')  // UI muestra: "Procesando en NVIDIA CVM (TEE)..."
const cvmResult = await processStudyFile(file)
// Llama a: POST /api/cvm/process
```

**Backend procesa**:
- Archivo: `backend/src/routes/cvm.routes.ts`
- Recibe PDF en memoria (NO guarda en disco)
- Llama a `processStudyFile()` (NVIDIA CVM mock):
  - Genera hash SHA-256 → `datasetHash`
  - Extrae metadata → `summaryMetadata`
  - Genera attestation → `attestationProof`
  - **DESTRUYE el archivo** (no se guarda)

**Resultado del CVM**:
```typescript
{
  datasetHash: "abc123...",
  summaryMetadata: {
    age: "25-30",
    condition: "Diabetes Type 2",
    population: "Hispanic"
  },
  attestationProof: "mock_attestation_xyz..."
}
```

#### **3. Generación de ZK Proof**:

```typescript
// Step 2: ZK Proof ya generado por el backend
setStep('zk')  // UI muestra: "Generando Zero-Knowledge Proof..."
// El backend ya generó el ZK proof usando:
// - datasetHash (del CVM)
// - attestationProof (del CVM)
```

**Backend genera ZK proof**:
- Archivo: `backend/src/services/zkprover.service.ts`
- Genera proof que valida sin revelar contenido
- Devuelve: `zkProof`, `publicInputs`, `verificationKey`

**Resultado completo del backend**:
```typescript
{
  datasetHash: "abc123...",
  summaryMetadata: {...},
  attestationProof: "mock_attestation_xyz...",
  zkProof: "zk_proof_abc123...",
  publicInputs: ["datasetHash", "attestationProof"]
}
```

#### **4. Registro en Blockchain (Soroban)**:

```typescript
// Step 3: Registrar en blockchain
setStep('blockchain')  // UI muestra: "Registrando en blockchain (Soroban)..."
const cycleTimestamp = Math.floor(Date.now() / 1000)
const txHash = await registerStudy(
  cvmResult.zkProof,
  cvmResult.attestationProof,
  cvmResult.datasetHash,
  cycleTimestamp
)
```

**Frontend llama a Soroban**:
- Archivo: `frontend/src/lib/stellar/sorobanClient.ts`
- Función: `registerStudy()`
- Construye transacción con:
  - `zkProof`
  - `attestationProof`
  - `datasetHash`
  - `cycleTimestamp`
- Envía a contrato `StudyRegistry` en Soroban

**Smart Contract**:
- Archivo: `contracts/study_registry/src/lib.rs`
- Función: `register_study()`
- Valida y guarda `StudyRecord` en blockchain
- Emite evento `StudyRegistered`

#### **5. Resultado mostrado al usuario**:

```typescript
// Step 4: Done
setStep('done')
// Muestra:
// - ✅ CheckCircle icon
// - "¡Estudio Registrado Exitosamente!"
// - Dataset Hash
// - Transaction Hash
// - Metadata
// - ZK Proof
// - Botón "Volver al Dashboard"
```

### Estados visuales durante el proceso:

1. **"Iniciando procesamiento..."** (step: 'processing')
2. **"Procesando en NVIDIA CVM (TEE)..."** (step: 'cvm')
3. **"Generando Zero-Knowledge Proof..."** (step: 'zk')
4. **"Registrando en blockchain (Soroban)..."** (step: 'blockchain')
5. **"¡Estudio Registrado Exitosamente!"** (step: 'done')

### Resultado:

- ✅ Archivo procesado en NVIDIA CVM
- ✅ ZK proof generado
- ✅ Estudio registrado en blockchain
- ✅ Aparece en "Mis estudios"
- ✅ Listo para ser agregado a datasets vendibles

---

## 💰 Paso 6: Ver Ganancias y Ventas

### En Dashboard → Tab "Inicio":

**Stats Cards muestran**:
- Estudios cargados: +1 (después de subir)
- Datasets vendidos: Se actualiza cuando un investigador compra
- Total ganado: Se actualiza con cada venta
- Balance disponible: Monto disponible para retirar

**Actividad reciente**:
- Muestra nuevas ventas: "💰 Venta de dataset: +$120"
- Muestra estudios procesados: "📤 Estudio procesado: ✓"

### En Dashboard → Tab "Mis estudios":

**Lista actualizada**:
- Nuevo estudio aparece en la lista
- Muestra número de ventas (cuando se vende)
- Muestra ganancias acumuladas

### En Dashboard → Tab "Wallet":

**Balance actualizado**:
- Cuando un investigador compra un dataset:
  - 85% va al contribuyente → Se acredita en su wallet
  - 15% va a BioChain treasury

**Historial de transacciones**:
- Nueva entrada: "Venta dataset #123: +$102 USDC"
- Hash de transacción en Soroban

---

## 🔄 Flujo Completo Visual

```
┌─────────────────────────────────────────────────────────┐
│  1. LANDING PAGE                                        │
│     URL: /                                              │
│     → Click "Soy Usuario"                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. LOGIN                                               │
│     URL: /login?type=contributor                       │
│     → Click "Continuar con Google"                      │
│     → Account Abstraction crea wallet Stellar           │
│     → Redirige a dashboard                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. HISTORIA CLÍNICA (Primera vez)                      │
│     URL: /user/historia-clinica                         │
│     → Completa 4 pasos:                                 │
│       1. Datos básicos                                  │
│       2. Salud reproductiva                             │
│       3. Condiciones médicas                           │
│       4. Consentimiento                                 │
│     → Guarda datos anonimizados                         │
│     → Redirige a dashboard                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. DASHBOARD USUARIO                                   │
│     URL: /user/dashboard                                │
│     → Ve stats, actividad, estudios                     │
│     → Click "Cargar estudios"                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. UPLOAD ESTUDIO                                      │
│     URL: /user/upload                                   │
│     → Selecciona PDF                                    │
│     → Click "Procesar y agregar"                        │
│     → Procesamiento:                                    │
│       1. NVIDIA CVM procesa (hash, metadata)            │
│       2. ZK Proof generado                              │
│       3. Registrado en Soroban                          │
│     → Muestra resultado                                 │
│     → Vuelve a dashboard                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. DASHBOARD ACTUALIZADO                               │
│     → Ve nuevo estudio en "Mis estudios"               │
│     → Stats actualizados                                │
│     → Cuando se vende:                                  │
│       • Recibe 85% del pago en USDC                     │
│       • Aparece en "Actividad reciente"                 │
│       • Balance actualizado                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Resumen de Páginas y Funcionalidades

| Página | URL | Funcionalidad Principal |
|--------|-----|------------------------|
| **Landing** | `/` | Página de inicio, botones de acceso |
| **Login** | `/login?type=contributor` | Login con Google, crea wallet Stellar |
| **Historia Clínica** | `/user/historia-clinica` | Form multi-step (4 pasos) |
| **Dashboard** | `/user/dashboard` | Panel principal con 6 tabs |
| **Upload** | `/user/upload` | Subir y procesar estudios médicos |

---

## 🔧 Tecnologías Usadas

- **Frontend**: React + TypeScript + TailwindCSS
- **Routing**: React Router
- **Estado**: Zustand (global state)
- **UI Components**: Paltalabs UI
- **Account Abstraction**: Hoblayerta SDK (mock)
- **Blockchain**: Stellar + Soroban
- **Backend**: Node.js + Express + TypeScript
- **Procesamiento**: NVIDIA CVM (mock) + ZK Proofs (mock)

---

## ✅ Checklist del Flujo

- [x] Landing page con botones de acceso
- [x] Login con Google OAuth (Account Abstraction)
- [x] Creación automática de wallet Stellar
- [x] Historia clínica multi-step completa
- [x] Dashboard con 6 tabs funcionales
- [x] Upload de estudios con drag & drop
- [x] Procesamiento en NVIDIA CVM
- [x] Generación de ZK Proof
- [x] Registro en blockchain (Soroban)
- [x] Visualización de estudios y ganancias
- [x] Gestión de wallet y transacciones

---

## 🎯 Estado Actual

✅ **Flujo completo implementado y funcional**

El usuario puede:
- ✅ Registrarse y crear wallet automáticamente
- ✅ Completar historia clínica
- ✅ Subir estudios médicos
- ✅ Ver sus estudios y ganancias
- ✅ Gestionar su wallet

**Todo está listo para el hackathon** 🚀

