/**
 * NVIDIA CVM Mock Service
 * Simula procesamiento en NVIDIA CVM para desarrollo/testing
 * 
 * IMPORTANTE: Este es un mock. En producción usar cvm-gateway-real.service.ts
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

/**
 * Procesa PDF en CVM (mock)
 * 
 * Simula el comportamiento del CVM real:
 * - Elimina PII (simulado)
 * - Extrae biomarkers (fake)
 * - Genera hash determinístico
 * - Genera attestation proof fake
 */
export const processPDFInMockCVM = async (
  pdfBuffer: Buffer
): Promise<CVMProcessResult> => {
  const startTime = Date.now()

  logger.info('Processing PDF in MOCK CVM', {
    size: pdfBuffer.length,
    mode: 'mock',
  })

  // Simular delay de procesamiento en TEE
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 1. Simular eliminación de PII
  // En producción, el CVM eliminaría: nombres, DNI, direcciones, teléfonos, emails, etc.
  logger.info('MOCK: Removing PII from PDF', { mode: 'mock' })

  // 2. Simular extracción de biomarkers
  // En producción, el CVM usaría NLP/ML para extraer del PDF
  const biomarkers = {
    glucose: '95-100 mg/dL',
    hemoglobin: '12-14 g/dL',
    cholesterol: '180-200 mg/dL',
  }

  // 3. Simular detección de laboratorio (anonimizado)
  const labInfo = {
    labName: 'Lab_Anonymized_' + crypto.randomBytes(8).toString('hex'),
    labType: 'Private',
  }

  // 4. Generar hash determinístico de datos limpios
  // Este hash se usa para deduplicación
  const cleanData = {
    biomarkers,
    labInfo,
    testDate: new Date().toISOString().split('T')[0],
    normalizedValues: {
      glucose: 97.5,
      hemoglobin: 13.0,
      cholesterol: 190,
    },
  }

  const datasetHash = generateDeterministicHash(cleanData)

  // 5. Generar metadata agregada
  const summaryMetadata = {
    age: '25-30',
    condition: 'Diabetes Type 2',
    population: 'Hispanic',
    biomarkers,
    labInfo,
  }

  // 6. Generar attestation proof fake
  // En producción, esto sería una firma criptográfica del enclave
  const attestationProof = `mock_attestation_${crypto.randomBytes(16).toString('hex')}_tee_simulated`

  const duration = Date.now() - startTime

  logger.info('MOCK CVM processing completed', {
    datasetHash: datasetHash.substring(0, 16) + '...',
    duration: `${duration}ms`,
    mode: 'mock',
  })

  // IMPORTANTE: Destruir buffer (sobreescribir con ceros)
  pdfBuffer.fill(0)

  return {
    datasetHash,
    summaryMetadata,
    attestationProof,
    mode: 'mock',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Genera hash determinístico de datos normalizados
 * 
 * Mismo algoritmo que el CVM real para consistencia
 */
const generateDeterministicHash = (cleanData: {
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


