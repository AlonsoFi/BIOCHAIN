/**
 * Contributor API Client
 * 
 * Fetches contributor-specific data:
 * - Studies uploaded
 * - Payouts received
 * - Total earnings
 * - Dataset usage
 */

import apiClient from './client'
import { useAuthStore } from '@/store/authStore'

export interface StudyRecord {
  studyId: string
  datasetHash: string
  timestamp: number
  contributor: string
}

export interface PayoutRecord {
  studyId: string
  datasetId: string
  amount: number // USDC amount (with 7 decimals)
  txHash: string
  timestamp: number
}

export interface ContributorEventsResponse {
  studies: StudyRecord[]
  payouts: PayoutRecord[]
  totalEarnedUSDC: number
  datasetUsage: Record<string, number> // studyId -> count of times used
}

/**
 * Get contributor events (studies, payouts, earnings)
 * 
 * @param walletAddress - Contributor's wallet address (optional, uses auth store if not provided)
 * @returns Contributor events and statistics
 */
export const getContributorEvents = async (
  walletAddress?: string
): Promise<ContributorEventsResponse> => {
  const { walletAddress: authWallet } = useAuthStore.getState()
  const address = walletAddress || authWallet

  if (!address) {
    throw new Error('Wallet address required')
  }

  const response = await apiClient.get(`/contributor/${address}/events`, {
    headers: {
      'x-wallet-address': address,
    },
  })

  return response.data
}

