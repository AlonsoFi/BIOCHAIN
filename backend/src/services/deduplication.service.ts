/**
 * Deduplication Service
 * Previene que un estudio (PDF) se suba dos veces
 * 
 * Almacena hashes de estudios procesados y verifica duplicados
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const HASHES_FILE = path.join(DATA_DIR, 'dataset-hashes.json')

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Cargar hashes desde archivo
const loadHashes = (): Set<string> => {
  try {
    if (fs.existsSync(HASHES_FILE)) {
      const data = JSON.parse(fs.readFileSync(HASHES_FILE, 'utf-8'))
      return new Set(data.hashes || [])
    }
  } catch (error) {
    logger.error('Error loading dataset hashes', { error })
  }
  return new Set()
}

// Guardar hashes a archivo
const saveHashes = (hashes: Set<string>) => {
  try {
    const data = {
      hashes: Array.from(hashes),
      lastUpdated: new Date().toISOString(),
    }
    fs.writeFileSync(HASHES_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    logger.error('Error saving dataset hashes', { error })
  }
}

// Storage de hashes con persistencia
const datasetHashes: Set<string> = loadHashes()

// Guardar automáticamente cada 5 segundos (debounce)
let saveTimeout: NodeJS.Timeout | null = null
const scheduleSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveHashes(datasetHashes)
  }, 5000)
}

/**
 * Verifica si un hash ya existe (duplicado)
 */
export const hashExists = (datasetHash: string): boolean => {
  return datasetHashes.has(datasetHash)
}

/**
 * Registra un hash (después de procesar un estudio)
 */
export const registerHash = (datasetHash: string): void => {
  if (datasetHashes.has(datasetHash)) {
    logger.warn('Attempted to register duplicate hash', {
      hash: datasetHash.substring(0, 16) + '...',
    })
    return
  }

  datasetHashes.add(datasetHash)
  scheduleSave()

  logger.info('Dataset hash registered', {
    hash: datasetHash.substring(0, 16) + '...',
    totalHashes: datasetHashes.size,
  })
}

/**
 * Obtiene todos los hashes registrados
 */
export const getAllHashes = (): string[] => {
  return Array.from(datasetHashes)
}

/**
 * Limpia todos los hashes (solo para tests)
 */
export const clearAllHashes = (): void => {
  datasetHashes.clear()
  saveHashes(datasetHashes)
}

// Guardar al cerrar el proceso
process.on('SIGINT', () => {
  saveHashes(datasetHashes)
  process.exit(0)
})

process.on('SIGTERM', () => {
  saveHashes(datasetHashes)
  process.exit(0)
})


