import apiClient from './client'

export interface Dataset {
  id: string
  name: string
  description: string
  price: number
  studyCount: number
  metadata: {
    ageRange: string
    condition: string
    population: string
  }
  tags: string[]
}

/**
 * Obtiene lista de datasets disponibles
 */
export const getDatasets = async (): Promise<Dataset[]> => {
  const response = await apiClient.get('/datasets')
  return response.data
}

/**
 * Obtiene detalle de un dataset
 */
export const getDataset = async (datasetId: string): Promise<Dataset> => {
  const response = await apiClient.get(`/datasets/${datasetId}`)
  return response.data
}

/**
 * Compra un dataset
 */
export const purchaseDataset = async (datasetId: string): Promise<{ success: boolean; txHash: string }> => {
  const response = await apiClient.post(`/datasets/${datasetId}/purchase`)
  return response.data
}

