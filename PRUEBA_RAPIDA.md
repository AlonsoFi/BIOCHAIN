# 🚀 Prueba Rápida - Integración CVM

## ✅ Pasos para Probar

### 1. Reiniciar Backend (aplicar cambios)

```bash
cd C:\Users\feder\Downloads\BIOCHAIN\BIOCHAIN
docker-compose restart backend
```

### 2. Verificar que el Backend Inicia

```bash
docker-compose logs backend --tail 20
```

**Deberías ver:**
```
🚀 Backend running on http://localhost:5000
```

### 3. Probar Endpoint CVM (desde Git Bash o PowerShell)

```bash
# Crear archivo de prueba
echo "test PDF content" > test.pdf

# Probar endpoint
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Respuesta esperada:**
```json
{
  "datasetHash": "abc123...",
  "summaryMetadata": {
    "age": "25-30",
    "condition": "Diabetes Type 2",
    ...
  },
  "attestationProof": "mock_attestation_...",
  "zkProof": "zk_proof_...",
  "mode": "mock",
  "duplicateCheck": "passed"
}
```

### 4. Probar Anti-Duplicado

```bash
# Primera subida (debe funcionar)
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Segunda subida del MISMO archivo (debe fallar)
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Segunda respuesta esperada (409 Conflict):**
```json
{
  "error": "Duplicate study",
  "message": "Este estudio ya fue procesado anteriormente",
  "datasetHash": "abc123..."
}
```

### 5. Verificar Logs

```bash
docker-compose logs backend | grep -i cvm
```

**Deberías ver:**
- `CVM Mode: MOCK (forced)` o `CVM Mode: AUTO`
- `CVM processing completed`
- `Dataset hash registered`

### 6. Verificar Persistencia

```bash
# Ver hashes guardados
cat backend/data/dataset-hashes.json
```

**Debería existir el archivo con los hashes registrados.**

## 🎯 Prueba desde Frontend

1. **Iniciar frontend** (si no está corriendo):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Abrir navegador**: `http://localhost:3000`

3. **Login** → Ir a "Cargar estudios"

4. **Subir un PDF** → Verificar que:
   - Se procesa correctamente
   - Muestra hash y metadata
   - No hay errores en consola

5. **Intentar subir el mismo PDF de nuevo** → Debe mostrar error de duplicado

## ✅ Checklist

- [ ] Backend inicia sin errores
- [ ] Endpoint `/api/cvm/process` responde
- [ ] Modo MOCK funciona (por defecto)
- [ ] Anti-duplicado detecta duplicados (409)
- [ ] Hashes se guardan en `data/dataset-hashes.json`
- [ ] Logs muestran información correcta
- [ ] Frontend puede subir PDFs

## 🐛 Si hay problemas

1. **Backend no inicia**: Verificar logs con `docker-compose logs backend`
2. **Error 500**: Revisar logs para ver el error específico
3. **Duplicado no funciona**: Verificar que `data/dataset-hashes.json` se crea
4. **CVM no procesa**: Verificar variable `CVM_MODE` (debe ser `mock` por defecto)

