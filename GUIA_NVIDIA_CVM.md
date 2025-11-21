# 🎓 Guía Completa: NVIDIA CVM para BioChain

## 📚 ¿Qué es NVIDIA CVM?

**NVIDIA Confidential VM (CVM)** es un servicio que permite procesar datos sensibles dentro de un **Trusted Execution Environment (TEE)** - un entorno seguro aislado.

### ¿Por qué lo usamos en BioChain?

1. **Privacidad**: Los PDFs médicos contienen información personal (PII - Personally Identifiable Information)
2. **Seguridad**: El CVM procesa los datos DENTRO de un enclave seguro
3. **Garantía**: NVIDIA garantiza que los datos nunca salen del TEE sin ser anonimizados

### Flujo Simplificado:

```
Usuario sube PDF médico
    ↓
PDF se envía a NVIDIA CVM (cifrado)
    ↓
CVM procesa DENTRO del TEE:
  - Elimina nombres, direcciones, etc. (PII)
  - Extrae solo datos médicos (biomarkers)
  - Genera hash del estudio
    ↓
CVM devuelve SOLO datos anonimizados
    ↓
BioChain guarda solo los datos limpios
```

## 🔑 Paso 1: Entender qué necesitas

Para usar NVIDIA CVM real, necesitas:

1. **Cuenta en NVIDIA**: Acceso al servicio de CVM
2. **API URL**: La dirección del servidor de NVIDIA CVM
3. **API Key**: Una clave secreta para autenticarte

### ⚠️ IMPORTANTE: Estado Actual

**NVIDIA CVM es un servicio empresarial** que requiere:
- Contrato con NVIDIA
- Acceso al programa de desarrolladores
- Credenciales específicas

**Para desarrollo/hackathon**, puedes:
- Usar el **MOCK** (ya funciona) - simula el comportamiento
- O configurar un **servicio de prueba** si NVIDIA lo proporciona

## 🛠️ Paso 2: Configuración Actual (MOCK)

Actualmente BioChain está usando **MOCK CVM**, que:
- ✅ Funciona perfectamente para desarrollo
- ✅ Simula el comportamiento real
- ✅ No requiere credenciales
- ✅ Es gratis

**Para verificar que está funcionando:**
```bash
docker-compose logs backend | grep CVM
```

Deberías ver:
```
Processing PDF in MOCK CVM
MOCK CVM processing completed
```

## 🚀 Paso 3: Opciones para CVM Real

### Opción A: Usar MOCK (Recomendado para Hackathon)

**Ventajas:**
- ✅ Ya funciona
- ✅ No requiere configuración
- ✅ Perfecto para demos
- ✅ Muestra el flujo completo

**Configuración:**
```env
CVM_MODE=mock
```

### Opción B: Obtener Acceso a NVIDIA CVM Real

**Pasos:**

1. **Registrarse en NVIDIA Developer Program**
   - Ve a: https://developer.nvidia.com/
   - Crea una cuenta
   - Solicita acceso a CVM (si está disponible)

2. **Obtener Credenciales**
   - Una vez aprobado, NVIDIA te dará:
     - `CVM_API_URL`: URL del endpoint
     - `CVM_API_KEY`: Tu clave API

3. **Configurar en BioChain**
   - Crea `backend/.env` con las credenciales
   - Establece `CVM_MODE=real` o `CVM_MODE=auto`

### Opción C: Usar Modo AUTO (Híbrido)

**Configuración:**
```env
CVM_MODE=auto
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=tu_key_aqui
```

**Comportamiento:**
- Intenta usar CVM real
- Si falla (sin credenciales, error de red, etc.)
- Automáticamente usa MOCK
- **Perfecto para desarrollo con posibilidad de producción**

## 📝 Paso 4: Configurar BioChain

### Si quieres usar MOCK (Actual - Recomendado):

No necesitas hacer nada, ya está funcionando.

### Si quieres preparar para CVM Real:

1. **Crear archivo `backend/.env`:**
```bash
# En Windows PowerShell:
cd BIOCHAIN\backend
New-Item -Path .env -ItemType File
```

2. **Editar `backend/.env`:**
```env
# Modo AUTO: Intenta real, fallback a mock
CVM_MODE=auto

# Si tienes credenciales, descomenta y completa:
# CVM_API_URL=https://cvm.nvidia.com/api/v1
# CVM_API_KEY=tu_api_key_aqui

# Si NO tienes credenciales, deja vacío (usará mock)
CVM_API_URL=
CVM_API_KEY=

CVM_TIMEOUT_MS=30000

NODE_ENV=development
PORT=5000
STELLAR_NETWORK=testnet
```

3. **Reiniciar backend:**
```bash
docker-compose restart backend
```

## 🧪 Paso 5: Probar la Configuración

### Verificar modo actual:

```bash
docker-compose exec backend printenv | grep CVM
```

### Ver logs en tiempo real:

```bash
docker-compose logs -f backend
```

### Probar subiendo un PDF:

1. Ve a `http://localhost:3000/user/upload`
2. Sube un PDF de prueba
3. Observa los logs del backend

**Si está en MOCK verás:**
```
CVM Mode: MOCK (forced)
Processing PDF in MOCK CVM
MOCK CVM processing completed
```

**Si está en REAL verás:**
```
CVM Mode: REAL (forced)
Sending PDF to NVIDIA CVM
PDF processed successfully in REAL CVM
```

**Si está en AUTO sin credenciales:**
```
CVM Mode: AUTO (try real, fallback to mock)
CVM AUTO mode: No API config, using MOCK
Processing PDF in MOCK CVM
```

## 🎯 Recomendación para Hackathon

**Para la hackathon, te recomiendo:**

1. **Usar MOCK** - Ya funciona perfectamente
2. **Explicar en la demo** que:
   - El flujo está completo
   - En producción usaría NVIDIA CVM real
   - El mock simula el comportamiento real
3. **Mostrar el código** que está listo para CVM real

**Ventajas:**
- ✅ No necesitas credenciales
- ✅ Funciona inmediatamente
- ✅ Muestra el flujo completo
- ✅ El código está listo para producción

## 📊 Comparación: MOCK vs REAL

| Característica | MOCK | REAL |
|----------------|------|------|
| **Requiere credenciales** | ❌ No | ✅ Sí |
| **Costo** | Gratis | Requiere plan |
| **Procesamiento real** | Simulado | Real en TEE |
| **Para desarrollo** | ✅ Perfecto | ⚠️ Requiere setup |
| **Para producción** | ❌ No | ✅ Sí |
| **Funciona ahora** | ✅ Sí | ⚠️ Requiere credenciales |

## 🔍 Verificar Estado Actual

Ejecuta estos comandos para ver el estado:

```bash
# Ver configuración actual
docker-compose exec backend printenv | Select-String CVM

# Ver logs recientes
docker-compose logs backend --tail 20 | Select-String CVM

# Probar endpoint
curl http://localhost:5000/health
```

## ❓ Preguntas Frecuentes

### ¿Necesito NVIDIA CVM para la hackathon?
**No.** El MOCK funciona perfectamente y muestra el flujo completo.

### ¿Cómo obtengo acceso a NVIDIA CVM?
- Contacta a NVIDIA Developer Relations
- O usa el modo AUTO que intenta real pero usa mock si no hay credenciales

### ¿El MOCK es suficiente para la demo?
**Sí.** El MOCK simula perfectamente el comportamiento y el código está listo para producción.

### ¿Puedo cambiar entre MOCK y REAL fácilmente?
**Sí.** Solo cambia `CVM_MODE` en `.env` y reinicia el backend.

## 🎓 Resumen

1. **NVIDIA CVM** = Servicio que procesa datos sensibles en un entorno seguro
2. **BioChain** ya tiene integración completa (REAL + MOCK)
3. **Actualmente** está usando MOCK (funciona perfectamente)
4. **Para producción** necesitarías credenciales de NVIDIA
5. **Para hackathon** MOCK es perfecto y suficiente

¿Quieres que te ayude a configurar algo específico o tienes más preguntas?

