/**
 * CVM Service Manager
 * Gestiona el procesamiento de PDFs con auto-switching entre REAL y MOCK
 * 
 * Modos:
 * - mock: Solo usa mock
 * - real: Solo usa real (falla si no está disponible)
 * - auto: Intenta real, fallback a mock si falla
 */

import { processPDFInRealCVM, type CVMProcessResult, type CVMError } from './cvm-gateway-real.service.js'
import { processPDFInMockCVM } from './cvm-gateway-mock.service.js'
import logger from '../utils/logger.js'

export type CVMMode = 'mock' | 'real' | 'auto'

export interface CVMConfig {
  mode: CVMMode
  apiUrl?: string
  apiKey?: string
  timeoutMs?: number
}

export interface CVMProcessOptions {
  encryptedPDFBuffer: Buffer
  config: CVMConfig
}

export interface CVMProcessResponse extends CVMProcessResult {
  fallbackUsed?: boolean
  fallbackReason?: string
  attemptedReal?: boolean
}

/**
 * Procesa PDF según configuración de modo
 */
export const processPDF = async (
  options: CVMProcessOptions
): Promise<CVMProcessResponse> => {
  const { encryptedPDFBuffer, config } = options
  const { mode, apiUrl, apiKey, timeoutMs } = config

  // Modo MOCK: Solo usar mock
  if (mode === 'mock') {
    logger.info('CVM Mode: MOCK (forced)', { mode })
    const result = await processPDFInMockCVM(encryptedPDFBuffer)
    return {
      ...result,
      attemptedReal: false,
      fallbackUsed: false,
    }
  }

  // Modo REAL: Solo usar real (falla si no está disponible)
  if (mode === 'real') {
    logger.info('CVM Mode: REAL (forced)', { mode })
    
    if (!apiUrl || !apiKey) {
      throw new Error('CVM API URL and API Key required for REAL mode')
    }

    try {
      const result = await processPDFInRealCVM(
        encryptedPDFBuffer,
        apiUrl,
        apiKey,
        timeoutMs
      )
      return {
        ...result,
        attemptedReal: true,
        fallbackUsed: false,
      }
    } catch (error: any) {
      logger.error('CVM REAL mode failed', {
        error: error.message,
        code: error.code,
        mode: 'real',
      })
      throw error // En modo REAL, no hay fallback
    }
  }

  // Modo AUTO: Intentar real, fallback a mock
  if (mode === 'auto') {
    logger.info('CVM Mode: AUTO (try real, fallback to mock)', { mode })

    // Si no hay configuración, usar mock directamente
    if (!apiUrl || !apiKey) {
      logger.warn('CVM AUTO mode: No API config, using MOCK', {
        hasApiUrl: !!apiUrl,
        hasApiKey: !!apiKey,
      })
      const result = await processPDFInMockCVM(encryptedPDFBuffer)
      return {
        ...result,
        attemptedReal: false,
        fallbackUsed: true,
        fallbackReason: 'No API configuration',
      }
    }

    // Intentar CVM real
    // IMPORTANTE: Crear copia del buffer antes de intentar REAL
    // porque processPDFInRealCVM destruye el buffer
    const bufferCopy = Buffer.from(encryptedPDFBuffer)
    
    try {
      logger.info('CVM AUTO: Attempting REAL CVM', {
        apiUrl: apiUrl.replace(/\/[^/]*$/, '/***'),
      })

      const result = await processPDFInRealCVM(
        bufferCopy, // Usar copia
        apiUrl,
        apiKey,
        timeoutMs
      )

      logger.info('CVM AUTO: REAL CVM succeeded', {
        datasetHash: result.datasetHash.substring(0, 16) + '...',
      })

      // Destruir buffer original también
      encryptedPDFBuffer.fill(0)

      return {
        ...result,
        attemptedReal: true,
        fallbackUsed: false,
      }
    } catch (error: any) {
      const cvmError = error as CVMError
      
      logger.warn('CVM AUTO: REAL CVM failed, falling back to MOCK', {
        errorCode: cvmError.code,
        errorMessage: cvmError.message,
        reason: getFallbackReason(cvmError),
        timestamp: new Date().toISOString(),
      })

      // Fallback a mock usando el buffer original (que no fue destruido)
      // El bufferCopy fue destruido en processPDFInRealCVM, pero encryptedPDFBuffer sigue intacto
      const mockResult = await processPDFInMockCVM(encryptedPDFBuffer)
      
      logger.info('CVM AUTO: Fallback to MOCK completed', {
        datasetHash: mockResult.datasetHash.substring(0, 16) + '...',
      })

      return {
        ...mockResult,
        attemptedReal: true,
        fallbackUsed: true,
        fallbackReason: getFallbackReason(cvmError),
      }
    }
  }

  throw new Error(`Invalid CVM mode: ${mode}`)
}

/**
 * Obtiene razón legible del fallback
 */
const getFallbackReason = (error: CVMError): string => {
  switch (error.code) {
    case 'TIMEOUT':
      return 'CVM request timeout'
    case 'QUOTA':
      return 'CVM quota exceeded'
    case 'INVALID_ATTESTATION':
      return 'Invalid attestation proof'
    case 'MALFORMED_RESPONSE':
      return 'Malformed CVM response'
    case 'NETWORK_ERROR':
      return 'Network error'
    default:
      return 'Unknown error'
  }
}

/**
 * Obtiene configuración CVM desde variables de entorno
 */
export const getCVMConfig = (): CVMConfig => {
  const mode = (process.env.CVM_MODE || 'auto') as CVMMode
  
  if (!['mock', 'real', 'auto'].includes(mode)) {
    logger.warn('Invalid CVM_MODE, defaulting to auto', { provided: mode })
  }

  return {
    mode: (['mock', 'real', 'auto'].includes(mode) ? mode : 'auto') as CVMMode,
    apiUrl: process.env.CVM_API_URL,
    apiKey: process.env.CVM_API_KEY,
    timeoutMs: parseInt(process.env.CVM_TIMEOUT_MS || '20000', 10),
  }
}


