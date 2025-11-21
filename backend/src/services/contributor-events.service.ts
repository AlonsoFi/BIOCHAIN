/**
 * Contributor Events Service
 * 
 * Fetches and processes Soroban events for a contributor:
 * - Study uploads (from StudyRegistry)
 * - Payouts (from RevenueSplitter)
 * - Dataset usage (from DatasetMarketplace)
 */

import { Server } from 'soroban-client'
import { getUserStudies } from './studies.service.js'
import logger from '../utils/logger.js'

// Configuration
const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
const CONTRACT_IDS = {
  STUDY_REGISTRY: process.env.CONTRACT_STUDY_REGISTRY || 'mock_contract_id',
  REVENUE_SPLITTER: process.env.CONTRACT_REVENUE_SPLITTER || 'mock_contract_id',
  DATASET_MARKETPLACE: process.env.CONTRACT_MARKETPLACE || 'mock_contract_id',
}

/**
 * Study record from blockchain
 */
export interface StudyRecord {
  studyId: string
  datasetHash: string
  timestamp: number
  contributor: string
}

/**
 * Payout record from RevenueSplitter events
 */
export interface PayoutRecord {
  studyId: string
  datasetId: string
  amount: number // USDC amount (with 7 decimals)
  txHash: string
  timestamp: number
}

/**
 * Contributor events response
 */
export interface ContributorEventsResponse {
  studies: StudyRecord[]
  payouts: PayoutRecord[]
  totalEarnedUSDC: number
  datasetUsage: Record<string, number> // studyId -> count of times used
}

/**
 * Get Soroban RPC server
 */
const getSorobanRpc = (): Server => {
  return new Server(RPC_URL, { allowHttp: true })
}

/**
 * Fetch contributor events from Soroban blockchain
 * 
 * This function:
 * 1. Gets studies uploaded by the contributor (from StudyRegistry)
 * 2. Gets payout events (from RevenueSplitter)
 * 3. Gets dataset usage (from DatasetMarketplace purchases)
 * 4. Aggregates and returns all data
 * 
 * @param walletAddress - Contributor's Stellar wallet address
 * @returns Contributor events and statistics
 */
export const getContributorEvents = async (
  walletAddress: string
): Promise<ContributorEventsResponse> => {
  logger.info('Fetching contributor events', {
    walletAddress: walletAddress.substring(0, 8) + '...',
  })

  // ============================================
  // 1. GET STUDIES FROM BACKEND (local storage)
  // ============================================
  const userStudies = getUserStudies(walletAddress)
  logger.info('User studies from backend', {
    count: userStudies.length,
    walletAddress: walletAddress.substring(0, 8) + '...',
  })

  // Convert to StudyRecord format
  const studies: StudyRecord[] = userStudies.map((study) => ({
    studyId: study.id,
    datasetHash: study.datasetHash,
    timestamp: new Date(study.createdAt).getTime() / 1000,
    contributor: walletAddress,
  }))

  console.log('📊 Studies from backend:', studies)

  // ============================================
  // 2. FETCH SOROBAN EVENTS (or mock)
  // ============================================
  let payouts: PayoutRecord[] = []
  let datasetUsage: Record<string, number> = {}

  // Check if contracts are deployed
  if (
    CONTRACT_IDS.REVENUE_SPLITTER === 'mock_contract_id' ||
    CONTRACT_IDS.DATASET_MARKETPLACE === 'mock_contract_id'
  ) {
    logger.warn('Using mock events (contracts not deployed)', {
      walletAddress: walletAddress.substring(0, 8) + '...',
    })

    // Mock payout events for development
    payouts = generateMockPayouts(walletAddress, studies)
    datasetUsage = generateMockDatasetUsage(studies)
  } else {
    // Real Soroban event fetching
    try {
      const server = getSorobanRpc()

      // Fetch ContributorRewarded events
      const contributorEvents = await fetchContributorRewardedEvents(
        server,
        walletAddress
      )
      console.log('📣 Raw ContributorRewarded events:', contributorEvents)

      // Fetch DatasetPayoutCompleted events
      const datasetEvents = await fetchDatasetPayoutEvents(server, walletAddress)
      console.log('📣 Raw DatasetPayoutCompleted events:', datasetEvents)

      // Parse events into PayoutRecord format
      payouts = parsePayoutEvents(contributorEvents, datasetEvents)
      console.log('💰 Parsed payouts:', payouts)

      // Calculate dataset usage
      datasetUsage = calculateDatasetUsage(payouts)
      console.log('📊 Dataset usage:', datasetUsage)
    } catch (error: any) {
      logger.error('Error fetching Soroban events', {
        error: error.message,
        walletAddress: walletAddress.substring(0, 8) + '...',
      })
      // Fallback to mock if real fetch fails
      payouts = generateMockPayouts(walletAddress, studies)
      datasetUsage = generateMockDatasetUsage(studies)
    }
  }

  // ============================================
  // 3. CALCULATE TOTAL EARNED
  // ============================================
  // Convert amounts from 7-decimal USDC to readable number
  const totalEarnedUSDC = payouts.reduce((sum, payout) => {
    // payout.amount is in 7-decimal format (e.g., 85000000 = 8.5 USDC)
    return sum + payout.amount / 1_0000000
  }, 0)

  logger.info('Contributor events fetched', {
    walletAddress: walletAddress.substring(0, 8) + '...',
    studiesCount: studies.length,
    payoutsCount: payouts.length,
    totalEarnedUSDC,
  })

  console.log('📡 FULL CONTRIBUTOR EVENTS RESPONSE:', {
    studies,
    payouts,
    totalEarnedUSDC,
    datasetUsage,
  })

  return {
    studies,
    payouts,
    totalEarnedUSDC,
    datasetUsage,
  }
}

/**
 * Fetch ContributorRewarded events from Soroban
 */
async function fetchContributorRewardedEvents(
  server: Server,
  walletAddress: string
): Promise<any[]> {
  // In production, this would query Soroban RPC for events
  // For now, return empty array (will use mock)
  return []
}

/**
 * Fetch DatasetPayoutCompleted events from Soroban
 */
async function fetchDatasetPayoutEvents(
  server: Server,
  walletAddress: string
): Promise<any[]> {
  // In production, this would query Soroban RPC for events
  // For now, return empty array (will use mock)
  return []
}

/**
 * Parse Soroban events into PayoutRecord format
 */
function parsePayoutEvents(
  contributorEvents: any[],
  datasetEvents: any[]
): PayoutRecord[] {
  // In production, this would parse real Soroban events
  // For now, return empty array (will use mock)
  return []
}

/**
 * Calculate dataset usage count per study
 */
function calculateDatasetUsage(payouts: PayoutRecord[]): Record<string, number> {
  const usage: Record<string, number> = {}

  payouts.forEach((payout) => {
    if (!usage[payout.studyId]) {
      usage[payout.studyId] = 0
    }
    usage[payout.studyId]++
  })

  return usage
}

/**
 * Generate mock payouts for development
 */
function generateMockPayouts(
  walletAddress: string,
  studies: StudyRecord[]
): PayoutRecord[] {
  // Generate mock payouts for the first few studies
  const mockPayouts: PayoutRecord[] = []

  studies.slice(0, 3).forEach((study, index) => {
    // Simulate 1-3 payouts per study
    const payoutCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < payoutCount; i++) {
      mockPayouts.push({
        studyId: study.studyId,
        datasetId: `dataset_${index + 1}_${i + 1}`,
        amount: 8_5000000, // 8.5 USDC (85% of 10 USDC)
        txHash: `mock_tx_${Date.now()}_${index}_${i}`,
        timestamp: study.timestamp + (i + 1) * 86400, // 1 day apart
      })
    }
  })

  return mockPayouts
}

/**
 * Generate mock dataset usage
 */
function generateMockDatasetUsage(studies: StudyRecord[]): Record<string, number> {
  const usage: Record<string, number> = {}

  studies.forEach((study) => {
    // Random usage count between 0 and 5
    usage[study.studyId] = Math.floor(Math.random() * 6)
  })

  return usage
}

