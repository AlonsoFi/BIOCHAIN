import apiClient from './client'

export interface Study {
  id: string
  name: string
  date: string
  type: string
  sales: number
  earnings: number
  datasetHash: string
}

/**
 * Obtiene estudios del usuario
 */
export const getStudies = async (): Promise<Study[]> => {
  const response = await apiClient.get('/studies')
  return response.data
}

