/**
 * NVIDIA CVM Real Service
 * Integración real con NVIDIA Confidential VM (TEE)
 * 
 * Procesa PDFs médicos dentro de un Trusted Execution Environment
 * Garantiza que PII nunca sale del enclave
 */

import crypto from 'crypto'
import logger from '../utils/logger.js'

export interface CVMProcessResult {
  datasetHash: string
  summaryMetadata: {
    age: string
    condition: string
    population?: string
    biomarkers?: {
      glucose?: string
      hemoglobin?: string
      cholesterol?: string
    }
    labInfo?: {
      labName: string
      labType: string
    }
  }
  attestationProof: string
  mode: 'real' | 'mock'
  timestamp: string
}

export interface CVMError {
  code: 'TIMEOUT' | 'QUOTA' | 'INVALID_ATTESTATION' | 'MALFORMED_RESPONSE' | 'NETWORK_ERROR'
  message: string
  details?: any
}

/**
 * Procesa PDF en NVIDIA CVM real
 * 
 * IMPORTANTE: El PDF se envía cifrado y se procesa dentro del TEE
 * El CVM elimina PII y devuelve solo datos anonimizados
 */
export const processPDFInRealCVM = async (
  encryptedPDFBuffer: Buffer,
  apiUrl: string,
  apiKey: string,
  timeoutMs: number = 20000
): Promise<CVMProcessResult> => {
  const startTime = Date.now()

  try {
    logger.info('Sending PDF to NVIDIA CVM', {
      size: encryptedPDFBuffer.length,
      apiUrl: apiUrl.replace(/\/[^/]*$/, '/***'), // Log parcial por seguridad
    })

    // Crear multipart form data para upload
    // En Node.js, usamos FormData del paquete form-data o construimos manualmente
    const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`
    const formDataParts: Buffer[] = []
    
    // Agregar archivo
    formDataParts.push(Buffer.from(`--${boundary}\r\n`))
    formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="medical_study.pdf"\r\n`))
    formDataParts.push(Buffer.from(`Content-Type: application/pdf\r\n\r\n`))
    formDataParts.push(encryptedPDFBuffer)
    formDataParts.push(Buffer.from(`\r\n`))
    
    // Agregar opciones
    formDataParts.push(Buffer.from(`--${boundary}\r\n`))
    formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="options"\r\n\r\n`))
    formDataParts.push(Buffer.from(JSON.stringify({
      removePII: true,
      extractBiomarkers: true,
      generateAttestation: true,
    })))
    formDataParts.push(Buffer.from(`\r\n--${boundary}--\r\n`))
    
    const formDataBuffer = Buffer.concat(formDataParts)

    // Llamar a NVIDIA CVM API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(`${apiUrl}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Request-ID': crypto.randomBytes(16).toString('hex'),
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length.toString(),
      },
      body: formDataBuffer,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 429) {
        throw {
          code: 'QUOTA' as const,
          message: 'CVM quota exceeded',
          details: { status: response.status },
        } as CVMError
      }

      if (response.status === 408 || response.status === 504) {
        throw {
          code: 'TIMEOUT' as const,
          message: 'CVM request timeout',
          details: { status: response.status },
        } as CVMError
      }

      throw {
        code: 'NETWORK_ERROR' as const,
        message: `CVM API error: ${response.status}`,
        details: { status: response.status },
      } as CVMError
    }

    const result = await response.json()

    // Validar respuesta
    if (!result.dataset_hash || !result.attestation_proof) {
      throw {
        code: 'MALFORMED_RESPONSE' as const,
        message: 'Invalid CVM response format',
        details: { received: Object.keys(result) },
      } as CVMError
    }

    // Validar attestation proof
    if (!validateAttestationProof(result.attestation_proof)) {
      throw {
        code: 'INVALID_ATTESTATION' as const,
        message: 'Invalid attestation proof from CVM',
        details: { attestation: result.attestation_proof.substring(0, 50) + '...' },
      } as CVMError
    }

    const duration = Date.now() - startTime

    logger.info('NVIDIA CVM processing completed', {
      datasetHash: result.dataset_hash.substring(0, 16) + '...',
      duration: `${duration}ms`,
      mode: 'real',
    })

    // Destruir buffer original (sobreescribir con ceros)
    encryptedPDFBuffer.fill(0)

    return {
      datasetHash: result.dataset_hash,
      summaryMetadata: result.summary_metadata || {
        age: result.age_range || 'unknown',
        condition: result.condition || 'unknown',
        population: result.population,
        biomarkers: result.biomarkers,
        labInfo: result.lab_info,
      },
      attestationProof: result.attestation_proof,
      mode: 'real',
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    // Destruir buffer en caso de error también
    encryptedPDFBuffer.fill(0)

    if (error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT' as const,
        message: 'CVM request timeout',
        details: { timeoutMs },
      } as CVMError
    }

    if (error.code) {
      throw error as CVMError
    }

    throw {
      code: 'NETWORK_ERROR' as const,
      message: error.message || 'Unknown CVM error',
      details: { originalError: error.toString() },
    } as CVMError
  }
}

/**
 * Valida attestation proof del CVM
 * 
 * En producción, esto verificaría la firma criptográfica del enclave
 */
const validateAttestationProof = (attestation: string): boolean => {
  if (!attestation || typeof attestation !== 'string') {
    return false
  }

  // Verificar formato básico (en producción sería verificación criptográfica real)
  // Debe contener información del TEE y firma
  const hasTEEInfo = attestation.includes('tee') || attestation.includes('enclave')
  const hasSignature = attestation.length > 100 // Attestation real sería más larga

  return hasTEEInfo && hasSignature
}

/**
 * Genera hash determinístico de datos normalizados
 * 
 * Usado para deduplicación
 */
export const generateDeterministicHash = (cleanData: {
  biomarkers: any
  labInfo: any
  testDate?: string
  normalizedValues: any
}): string => {
  // Normalizar datos para hash determinístico
  const normalized = {
    biomarkers: JSON.stringify(cleanData.biomarkers).toLowerCase(),
    labInfo: cleanData.labInfo?.labName?.toLowerCase() || '',
    testDate: cleanData.testDate || '',
    values: JSON.stringify(cleanData.normalizedValues || {}).toLowerCase(),
  }

  const hashInput = JSON.stringify(normalized)
  return crypto.createHash('sha256').update(hashInput).digest('hex')
}

