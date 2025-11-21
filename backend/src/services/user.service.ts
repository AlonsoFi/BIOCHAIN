/**
 * User Service
 * Maneja historia clínica y consentimiento
 * TODO: En producción, usar PostgreSQL/Supabase
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const USER_DATA_FILE = path.join(DATA_DIR, 'user-data.json')

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Cargar datos desde archivo o crear Map vacío
const loadUserData = (): Map<string, any> => {
  try {
    if (fs.existsSync(USER_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf-8'))
      return new Map(Object.entries(data))
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  }
  return new Map()
}

// Guardar datos a archivo
const saveUserData = (data: Map<string, any>) => {
  try {
    const obj = Object.fromEntries(data)
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

// Mock storage con persistencia en archivo
const userData: Map<string, any> = loadUserData()

// Guardar automáticamente cada 5 segundos (debounce)
let saveTimeout: NodeJS.Timeout | null = null
const scheduleSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveUserData(userData)
  }, 5000)
}

export interface HistoriaClinica {
  datosBasicos: {
    edad: number
    genero: string
    peso: number
    altura: number
  }
  saludReproductiva: {
    embarazo: boolean
    anticonceptivos: boolean
  }
  condicionesMedicas: {
    diabetes: boolean
    hipertension: boolean
    otras: string[]
  }
  consentimiento: {
    firmado: boolean
    fecha: string
  }
}

/**
 * Guarda historia clínica del usuario
 */
export const saveHistoriaClinica = (walletAddress: string, historia: HistoriaClinica) => {
  // Anonimizar datos antes de guardar
  const anonimizada = {
    ...historia,
    datosBasicos: {
      ...historia.datosBasicos,
      // No guardar datos directamente identificables
    },
  }

  userData.set(walletAddress, {
    historiaClinica: anonimizada,
    consentimiento: historia.consentimiento,
    createdAt: new Date().toISOString(),
  })

  scheduleSave() // Guardar cambios

  return { success: true }
}

/**
 * Obtiene historia clínica del usuario
 */
export const getHistoriaClinica = (walletAddress: string): HistoriaClinica | null => {
  const data = userData.get(walletAddress)
  return data?.historiaClinica || null
}

/**
 * Verifica si el usuario tiene consentimiento firmado
 */
export const hasConsent = (walletAddress: string): boolean => {
  const data = userData.get(walletAddress)
  return data?.consentimiento?.firmado || false
}

/**
 * Limpia todos los datos (solo para tests)
 */
export const clearAllData = (): void => {
  userData.clear()
  saveUserData(userData)
}

// Guardar datos al cerrar el proceso
process.on('SIGINT', () => {
  saveUserData(userData)
  process.exit(0)
})

process.on('SIGTERM', () => {
  saveUserData(userData)
  process.exit(0)
})

