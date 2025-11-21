/**
 * Soroban API Client
 * 
 * Cliente para interactuar con los endpoints de Soroban en el backend
 */

import apiClient from './client'
import { useAuthStore } from '@/store/authStore'

/**
 * Register a study on-chain
 * 
 * @param datasetHash - Hex string (64 chars)
 * @param attestation - Attestation proof from CVM
 * @param zkProof - ZK proof from backend
 * @returns Transaction hash and study ID
 */
export const registerStudyOnChain = async (
  datasetHash: string,
  attestation: string,
  zkProof: string
): Promise<{
  success: boolean
  transactionHash: string
  studyId: string
  message: string
}> => {
  const { walletAddress } = useAuthStore.getState()
  
  if (!walletAddress) {
    throw new Error('No hay wallet conectada')
  }

  const response = await apiClient.post(
    '/soroban/register-study',
    {
      datasetHash,
      attestation,
      zkProof,
      // secretKey is optional, can be passed if needed for signing
    },
    {
      headers: {
        'x-wallet-address': walletAddress,
      },
    }
  )

  return response.data
}

/**
 * Register a dataset on-chain
 * 
 * @param datasetId - Dataset identifier
 * @param studyIds - Array of study hashes (hex, 64 chars each)
 * @param priceUsdc - Price in USDC
 * @returns Transaction hash
 */
export const registerDatasetOnChain = async (
  datasetId: string,
  studyIds: string[],
  priceUsdc: number
): Promise<{
  success: boolean
  transactionHash: string
  datasetId: string
  message: string
}> => {
  const { walletAddress } = useAuthStore.getState()
  
  if (!walletAddress) {
    throw new Error('No hay wallet conectada')
  }

  const response = await apiClient.post(
    '/soroban/register-dataset',
    {
      datasetId,
      studyIds,
      priceUsdc,
    },
    {
      headers: {
        'x-wallet-address': walletAddress,
      },
    }
  )

  return response.data
}

/**
 * Purchase a dataset on-chain
 * 
 * @param datasetId - Dataset identifier
 * @returns Transaction hash and purchase info
 */
export const purchaseDatasetOnChain = async (
  datasetId: string
): Promise<{
  success: boolean
  transactionHash: string
  datasetId: string
  priceUsdc: number
  message: string
}> => {
  const { walletAddress } = useAuthStore.getState()
  
  if (!walletAddress) {
    throw new Error('No hay wallet conectada')
  }

  const response = await apiClient.post(
    '/soroban/purchase-dataset',
    {
      datasetId,
    },
    {
      headers: {
        'x-wallet-address': walletAddress,
      },
    }
  )

  return response.data
}

