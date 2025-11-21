import apiClient from './client'

export interface CVMProcessResult {
  datasetHash: string
  summaryMetadata: {
    age: string
    condition: string
    population?: string
    biomarkers?: {
      glucose?: string
      hemoglobin?: string
      cholesterol?: string
    }
    labInfo?: {
      labName: string
      labType: string
    }
  }
  attestationProof: string
  zkProof: string // Zero-Knowledge proof generada por el backend
  publicInputs: string[] // Inputs públicos para verificar la proof
}

/**
 * Procesa archivo PDF en CVM (NVIDIA TEE)
 * El backend NO guarda el PDF, solo lo procesa
 */
export const processStudyFile = async (file: File): Promise<CVMProcessResult> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/cvm/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

