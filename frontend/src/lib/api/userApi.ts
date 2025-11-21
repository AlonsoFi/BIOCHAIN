import apiClient from './client'

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
export const saveHistoriaClinica = async (historia: HistoriaClinica) => {
  const response = await apiClient.post('/user/history', historia)
  return response.data
}

/**
 * Obtiene historia clínica del usuario
 * Retorna null si no existe (404 es esperado)
 */
export const getHistoriaClinica = async () => {
  try {
    const response = await apiClient.get('/user/history')
    return response.data
  } catch (error: any) {
    // 404 es esperado cuando el usuario no tiene historia clínica
    if (error.response?.status === 404) {
      return null
    }
    // Re-lanzar otros errores
    throw error
  }
}

