# 🧪 Cómo Probar la Integración CVM

## ✅ Verificación Rápida

### 1. Verificar que el código compila

```bash
cd backend
npm run build
```

Si no hay errores, el código está bien.

### 2. Probar con Docker

```bash
# Reiniciar contenedores para aplicar cambios
docker-compose restart backend

# Ver logs
docker-compose logs -f backend
```

### 3. Probar el endpoint CVM

#### Opción A: Con curl (desde terminal)

```bash
# Crear un archivo PDF de prueba
echo "test PDF content" > test.pdf

# Probar endpoint
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

#### Opción B: Desde el frontend

1. Iniciar frontend: `cd frontend && npm run dev`
2. Ir a `http://localhost:3000/user/upload`
3. Subir un PDF
4. Verificar en logs del backend que:
   - Se procesa en CVM (mock o real según configuración)
   - Se verifica duplicado
   - Se genera ZK proof
   - Se registra el hash

### 4. Verificar Anti-Duplicado

```bash
# Primera subida (debe funcionar)
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Segunda subida del mismo archivo (debe fallar con 409 Conflict)
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Respuesta esperada en segunda subida:**
```json
{
  "error": "Duplicate study",
  "message": "Este estudio ya fue procesado anteriormente",
  "datasetHash": "abc123..."
}
```

### 5. Verificar Modos CVM

#### Modo MOCK (por defecto)

```bash
# En backend/.env o docker-compose.yml
CVM_MODE=mock
```

**Comportamiento esperado:**
- Logs muestran: `CVM Mode: MOCK (forced)`
- Procesamiento rápido (~2 segundos)
- Attestation proof contiene `mock_attestation_`

#### Modo AUTO (con fallback)

```bash
# En backend/.env
CVM_MODE=auto
CVM_API_URL=https://fake-url.com  # URL que no existe para probar fallback
```

**Comportamiento esperado:**
- Logs muestran: `CVM Mode: AUTO (try real, fallback to mock)`
- Intenta conectar a CVM real
- Si falla, usa MOCK automáticamente
- Logs muestran: `CVM AUTO: REAL CVM failed, falling back to MOCK`

### 6. Verificar Persistencia de Hashes

```bash
# Ver archivo de hashes
cat backend/data/dataset-hashes.json
```

**Debería contener:**
```json
{
  "hashes": [
    "abc123def456...",
    "xyz789uvw012..."
  ],
  "lastUpdated": "2025-01-21T10:30:00Z"
}
```

### 7. Verificar Logs

Los logs deberían mostrar:

```
[info] Processing file in CVM { filename: "test.pdf", size: 1234 }
[info] CVM Mode: MOCK (forced) { mode: "mock" }
[info] MOCK CVM processing completed { datasetHash: "abc...", duration: "2150ms" }
[info] CVM processing completed { datasetHash: "abc...", mode: "mock" }
[info] Dataset hash registered { hash: "abc...", totalHashes: 1 }
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'crypto'"
- Verificar que `@types/node` está instalado
- Ejecutar: `npm install`

### Error: "CVM service unavailable"
- Verificar variables de entorno
- Si `CVM_MODE=real`, asegurar que `CVM_API_URL` y `CVM_API_KEY` están configurados
- Si `CVM_MODE=auto`, debería hacer fallback automático

### Error: "Duplicate study" en primera subida
- Limpiar hashes: eliminar `backend/data/dataset-hashes.json`
- O usar función `clearAllHashes()` en tests

### El buffer no se destruye
- Verificar que `buffer.fill(0)` se ejecuta
- Revisar logs para confirmar destrucción

## ✅ Checklist de Pruebas

- [ ] Código compila sin errores
- [ ] Backend inicia correctamente
- [ ] Endpoint `/api/cvm/process` responde
- [ ] Modo MOCK funciona
- [ ] Modo AUTO hace fallback correctamente
- [ ] Anti-duplicado detecta duplicados (409 Conflict)
- [ ] Hashes se guardan en `data/dataset-hashes.json`
- [ ] Buffers se destruyen después del procesamiento
- [ ] Logs muestran información correcta
- [ ] Frontend puede subir PDFs

## 🚀 Próximos Pasos

1. Configurar CVM real (si tienes acceso):
   ```env
   CVM_MODE=auto
   CVM_API_URL=https://tu-endpoint-nvidia.com
   CVM_API_KEY=tu_api_key
   ```

2. Deploy contratos Soroban para verificación on-chain

3. Integrar ZK proofs reales

