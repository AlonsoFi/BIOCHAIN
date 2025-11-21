# Variables de Entorno - NVIDIA CVM

## Configuración Requerida

Copia estas variables a tu archivo `.env` en `backend/`:

```env
# ============================================
# NVIDIA CVM Configuration
# ============================================

# Modo de operación del CVM
# Opciones: mock | real | auto
# - mock: Solo usa mock (desarrollo)
# - real: Solo usa CVM real (falla si no disponible)
# - auto: Intenta real, fallback a mock si falla (recomendado)
CVM_MODE=auto

# URL del endpoint de NVIDIA CVM (solo si CVM_MODE=real o auto)
# Ejemplo: https://cvm.nvidia.com/api/v1
CVM_API_URL=

# API Key de NVIDIA CVM (solo si CVM_MODE=real o auto)
# Ejemplo: sk_live_abc123...
CVM_API_KEY=

# Timeout para requests al CVM (en milisegundos)
# Default: 20000 (20 segundos)
CVM_TIMEOUT_MS=20000
```

## Ejemplos de Configuración

### Desarrollo (Solo Mock)

```env
CVM_MODE=mock
```

### Producción con Fallback

```env
CVM_MODE=auto
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=sk_live_your_key_here
CVM_TIMEOUT_MS=30000
```

### Producción Solo Real (Sin Fallback)

```env
CVM_MODE=real
CVM_API_URL=https://cvm.nvidia.com/api/v1
CVM_API_KEY=sk_live_your_key_here
CVM_TIMEOUT_MS=30000
```

## Notas

- Si `CVM_MODE=auto` y no hay `CVM_API_URL` o `CVM_API_KEY`, usará MOCK automáticamente
- Si `CVM_MODE=real` y falta configuración, lanzará error
- El timeout debe ser suficiente para procesar PDFs grandes (recomendado: 30-60 segundos)


