import apiClient from './client'

export interface Study {
  id: string
  name: string
  date: string
  type: string
  sales: number
  earnings: number
  datasetHash: string
  txHash?: string
  createdAt?: string
}

/**
 * Obtiene estudios del usuario
 */
export const getStudies = async (): Promise<Study[]> => {
  const response = await apiClient.get('/studies')
  return response.data
}

/**
 * Guarda un estudio después del upload
 */
export const saveStudy = async (studyData: {
  name: string
  type: string
  datasetHash: string
  txHash?: string
}): Promise<Study> => {
  const response = await apiClient.post('/studies', studyData)
  return response.data
}

