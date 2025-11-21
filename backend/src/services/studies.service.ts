/**
 * Studies Service
 * Maneja estudios subidos por usuarios
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerStudy } from './dataset-aggregator.service.js'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const USER_STUDIES_FILE = path.join(DATA_DIR, 'user-studies.json')

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Cargar datos desde archivo o crear objeto vacío
const loadUserStudies = (): Record<string, any[]> => {
  try {
    if (fs.existsSync(USER_STUDIES_FILE)) {
      return JSON.parse(fs.readFileSync(USER_STUDIES_FILE, 'utf-8'))
    }
  } catch (error) {
    logger.error('Error loading user studies', { error })
  }
  return {}
}

// Guardar datos a archivo
const saveUserStudies = (data: Record<string, any[]>) => {
  try {
    fs.writeFileSync(USER_STUDIES_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    logger.error('Error saving user studies', { error })
  }
}

// Storage con persistencia en archivo
const userStudies: Record<string, any[]> = loadUserStudies()

// Guardar automáticamente cada 5 segundos (debounce)
let saveTimeout: NodeJS.Timeout | null = null
const scheduleSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveUserStudies(userStudies)
  }, 5000)
}

export interface Study {
  id: string
  name: string
  date: string
  type: string
  sales: number
  earnings: number
  datasetHash: string
  txHash?: string
  createdAt: string
}

/**
 * Guarda un estudio para un usuario
 */
export const saveUserStudy = (
  walletAddress: string,
  studyData: {
    name: string
    type: string
    datasetHash: string
    txHash?: string
  }
): Study => {
  const study: Study = {
    id: `study_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: studyData.name,
    date: new Date().toISOString().split('T')[0],
    type: studyData.type,
    sales: 0,
    earnings: 0,
    datasetHash: studyData.datasetHash,
    txHash: studyData.txHash,
    createdAt: new Date().toISOString(),
  }

  if (!userStudies[walletAddress]) {
    userStudies[walletAddress] = []
  }

  userStudies[walletAddress].push(study)
  scheduleSave()

  // Registrar en dataset aggregator también
  registerStudy(study.id, {
    datasetHash: study.datasetHash,
    walletAddress,
    createdAt: study.createdAt,
  })

  return study
}

/**
 * Obtiene estudios de un usuario
 */
export const getUserStudies = (walletAddress: string): Study[] => {
  return userStudies[walletAddress] || []
}

/**
 * Actualiza ventas y ganancias de un estudio
 */
export const updateStudySales = (studyId: string, earnings: number) => {
  for (const walletAddress in userStudies) {
    const study = userStudies[walletAddress].find((s) => s.id === studyId)
    if (study) {
      study.sales += 1
      study.earnings += earnings
      scheduleSave()
      break
    }
  }
}

// Guardar datos al cerrar el proceso
process.on('SIGINT', () => {
  saveUserStudies(userStudies)
  process.exit(0)
})

process.on('SIGTERM', () => {
  saveUserStudies(userStudies)
  process.exit(0)
})

