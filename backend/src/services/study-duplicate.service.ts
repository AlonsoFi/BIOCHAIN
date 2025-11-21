/**
 * Study Duplicate Detection Service
 * 
 * Verifica duplicados en múltiples capas:
 * 1. Base de datos local (deduplication.service)
 * 2. Blockchain (Soroban StudyRegistry contract) - opcional
 * 
 * IMPORTANTE: Esta verificación debe ejecutarse ANTES de:
 * - Generar ZK proof
 * - Registrar en blockchain
 * - Guardar metadata
 */

import { hashExists } from './deduplication.service.js'
import { DuplicateStudyError } from '../errors/DuplicateStudyError.js'
import logger from '../utils/logger.js'

/**
 * Verifica si un dataset_hash existe en la base de datos local
 * 
 * @param datasetHash - Hash del dataset a verificar
 * @returns true si existe (duplicado), false si no existe
 */
export const checkDuplicateInDB = async (datasetHash: string): Promise<boolean> => {
  try {
    const exists = hashExists(datasetHash)
    
    logger.debug('Duplicate check in DB', {
      datasetHash: datasetHash.substring(0, 16) + '...',
      exists,
    })
    
    return exists
  } catch (error: any) {
    logger.error('Error checking duplicate in DB', {
      error: error.message,
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    // En caso de error, asumir que no es duplicado para no bloquear
    return false
  }
}

/**
 * Verifica si un dataset_hash existe en blockchain (Soroban)
 * 
 * NOTA: Esta es una verificación opcional que puede fallar si:
 * - El contrato no está deployado
 * - Hay problemas de red
 * - El servicio de Soroban no está disponible
 * 
 * En caso de error, se asume que NO es duplicado para no bloquear el flujo
 * 
 * @param datasetHash - Hash del dataset a verificar
 * @returns true si existe (duplicado), false si no existe o hay error
 */
export const checkDuplicateOnChain = async (datasetHash: string): Promise<boolean> => {
  try {
    // TODO: Implementar verificación real en Soroban cuando el contrato esté deployado
    // Por ahora, retornamos false (no duplicado) para no bloquear
    
    // Ejemplo de implementación futura:
    // const contract = getStudyRegistryContract()
    // const result = await contract.call('has_hash', datasetHash)
    // return result === true
    
    logger.debug('Duplicate check on-chain (not implemented yet)', {
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    
    return false // No implementado aún, asumir que no es duplicado
  } catch (error: any) {
    logger.warn('Error checking duplicate on-chain (non-blocking)', {
      error: error.message,
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    // En caso de error, asumir que no es duplicado para no bloquear
    return false
  }
}

/**
 * Verifica duplicados en todas las capas y lanza error si encuentra uno
 * 
 * @param datasetHash - Hash del dataset a verificar
 * @throws DuplicateStudyError si el hash ya existe
 */
export const assertNotDuplicate = async (datasetHash: string): Promise<void> => {
  // Verificar en base de datos local (prioridad)
  const existsInDB = await checkDuplicateInDB(datasetHash)
  
  if (existsInDB) {
    logger.warn('Duplicate study detected in DB', {
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    
    throw new DuplicateStudyError(
      'This study has already been uploaded. Please upload a different PDF.',
      datasetHash
    )
  }

  // Verificar en blockchain (opcional, no bloqueante si falla)
  const existsOnChain = await checkDuplicateOnChain(datasetHash)
  
  if (existsOnChain) {
    logger.warn('Duplicate study detected on-chain', {
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    
    throw new DuplicateStudyError(
      'This study has already been uploaded to blockchain. Please upload a different PDF.',
      datasetHash
    )
  }

  logger.debug('Duplicate check passed', {
    datasetHash: datasetHash.substring(0, 16) + '...',
  })
}

