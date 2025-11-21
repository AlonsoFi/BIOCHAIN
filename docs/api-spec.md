# 📡 BioChain API Specification

## Base URL

```
http://localhost:5000/api
```

## Authentication

Los endpoints requieren el header:
```
X-Wallet-Address: <wallet_address>
```

## Endpoints

### User

#### POST /api/user/history
Guarda historia clínica del usuario.

**Request Body:**
```json
{
  "datosBasicos": {
    "edad": 30,
    "genero": "femenino",
    "peso": 65,
    "altura": 165
  },
  "saludReproductiva": {
    "embarazo": false,
    "anticonceptivos": true
  },
  "condicionesMedicas": {
    "diabetes": false,
    "hipertension": true,
    "otras": []
  },
  "consentimiento": {
    "firmado": true,
    "fecha": "2024-01-01T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /api/user/history
Obtiene historia clínica del usuario.

**Response:**
```json
{
  "datosBasicos": { ... },
  "saludReproductiva": { ... },
  "condicionesMedicas": { ... },
  "consentimiento": { ... }
}
```

### CVM

#### POST /api/cvm/process
Procesa archivo PDF en CVM (NVIDIA TEE).

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF o imagen)

**Response:**
```json
{
  "datasetHash": "abc123...",
  "summaryMetadata": {
    "age": "25-30",
    "condition": "Diabetes Type 2",
    "population": "Hispanic"
  },
  "attestationProof": "attestation_123",
  "zkProof": "zk_proof_123",
  "publicInputs": ["hash1", "hash2"]
}
```

### Datasets

#### GET /api/datasets
Obtiene todos los datasets disponibles.

**Response:**
```json
[
  {
    "id": "dataset_1",
    "name": "Diabetes Type 2",
    "description": "...",
    "price": 100,
    "studyCount": 50,
    "metadata": {
      "ageRange": "25-30",
      "condition": "Diabetes Type 2",
      "population": "Hispanic"
    },
    "tags": ["diabetes", "type-2"]
  }
]
```

#### GET /api/datasets/:id
Obtiene un dataset específico.

#### POST /api/datasets/:id/purchase
Compra un dataset.

**Response:**
```json
{
  "success": true,
  "txHash": "tx_hash_123",
  "accessToken": "access_token_123"
}
```

