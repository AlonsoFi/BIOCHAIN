# 🔧 Configurar NVIDIA CVM Real

## Pasos para Configurar CVM Real

### 1. Crear archivo `.env` en `backend/`

Crea el archivo `backend/.env` con el siguiente contenido:

```env
# ============================================
# NVIDIA CVM Configuration
# ============================================

# Modo de operación del CVM
# Opciones: mock | real | auto
CVM_MODE=real

# URL del endpoint de NVIDIA CVM
# IMPORTANTE: Reemplaza con tu URL real de NVIDIA CVM
CVM_API_URL=https://cvm.nvidia.com/api/v1

# API Key de NVIDIA CVM
# IMPORTANTE: Reemplaza con tu API Key real de NVIDIA
CVM_API_KEY=tu_api_key_aqui

# Timeout para requests al CVM (en milisegundos)
# Recomendado: 30000-60000 para PDFs grandes
CVM_TIMEOUT_MS=30000

# ============================================
# Otras configuraciones
# ============================================

NODE_ENV=development
PORT=5000
STELLAR_NETWORK=testnet
```

### 2. Obtener Credenciales de NVIDIA CVM

**Necesitas:**
- **CVM_API_URL**: URL del endpoint de NVIDIA CVM
  - Ejemplo: `https://cvm.nvidia.com/api/v1`
  - O la URL que te proporcione NVIDIA
  
- **CVM_API_KEY**: Tu API Key de NVIDIA
  - Formato típico: `sk_live_...` o similar
  - Obténla desde el dashboard de NVIDIA

### 3. Editar el archivo `.env`

Abre `backend/.env` y reemplaza:
- `CVM_API_URL` con tu URL real
- `CVM_API_KEY` con tu API Key real

### 4. Reiniciar el Backend

```bash
docker-compose restart backend
```

O si prefieres reconstruir:

```bash
docker-compose down
docker-compose up -d --build
```

### 5. Verificar que Funciona

Revisa los logs del backend:

```bash
docker-compose logs -f backend
```

Deberías ver mensajes como:
```
CVM Mode: REAL (forced)
Sending PDF to NVIDIA CVM
PDF processed successfully in REAL CVM
```

## Modo AUTO (Recomendado)

Si prefieres que intente usar CVM real pero haga fallback a mock si falla:

```env
CVM_MODE=auto
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=tu_api_key_aqui
CVM_TIMEOUT_MS=30000
```

Con `auto`, si el CVM real no está disponible, automáticamente usará el mock.

## Verificar Configuración

Para verificar que las variables están cargadas:

```bash
docker-compose exec backend printenv | grep CVM
```

Deberías ver:
```
CVM_MODE=real
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=sk_live_...
CVM_TIMEOUT_MS=30000
```

## Troubleshooting

### Error: "CVM API URL and API Key required for REAL mode"
- Verifica que `CVM_API_URL` y `CVM_API_KEY` estén configurados en `.env`
- Reinicia el backend después de editar `.env`

### Error: "CVM request timeout"
- Aumenta `CVM_TIMEOUT_MS` a 60000 (60 segundos)
- Verifica tu conexión a internet

### Error: "CVM quota exceeded"
- Has alcanzado el límite de requests de tu plan de NVIDIA
- Espera o actualiza tu plan

### Error: "Network error"
- Verifica que `CVM_API_URL` sea correcta
- Verifica tu conexión a internet
- Verifica que el endpoint de NVIDIA esté disponible

