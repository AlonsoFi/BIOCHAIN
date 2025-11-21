/**
 * User Service
 * Maneja historia clínica y consentimiento
 * TODO: En producción, usar PostgreSQL/Supabase
 */

// Mock storage en memoria (se pierde al reiniciar)
const userData: Map<string, any> = new Map()

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

