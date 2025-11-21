# 🧪 Comandos para Probar CVM

## 1. Reiniciar Backend (aplicar cambios)

```bash
cd C:\Users\feder\Downloads\BIOCHAIN\BIOCHAIN
docker-compose restart backend
```

## 2. Ver Logs en Tiempo Real

```bash
docker-compose logs -f backend
```

## 3. Probar Endpoint CVM

### Con PowerShell:

```powershell
# Crear archivo de prueba
"test PDF content" | Out-File -FilePath test.pdf -Encoding utf8

# Probar endpoint
$file = Get-Item test.pdf
$form = @{
    file = $file
}
Invoke-RestMethod -Uri "http://localhost:5000/api/cvm/process" -Method Post -Form $form -Headers @{"x-wallet-address"="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
```

### Con Git Bash:

```bash
# Crear archivo de prueba
echo "test PDF content" > test.pdf

# Probar endpoint
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

## 4. Verificar Respuesta

**Deberías recibir:**
```json
{
  "datasetHash": "abc123...",
  "summaryMetadata": {...},
  "attestationProof": "mock_attestation_...",
  "zkProof": "zk_proof_...",
  "mode": "mock",
  "duplicateCheck": "passed"
}
```

## 5. Probar Anti-Duplicado

**Segunda subida del mismo archivo:**
```bash
curl -X POST http://localhost:5000/api/cvm/process \
  -F "file=@test.pdf" \
  -H "x-wallet-address: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Debería responder:**
```json
{
  "error": "Duplicate study",
  "message": "Este estudio ya fue procesado anteriormente"
}
```

## 6. Ver Hashes Guardados

```bash
cat backend/data/dataset-hashes.json
```

## 7. Verificar Logs Específicos

```bash
docker-compose logs backend | Select-String "CVM"
```

