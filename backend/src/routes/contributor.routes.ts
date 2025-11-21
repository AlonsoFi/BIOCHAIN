import express from 'express'
import { WalletAddressSchema } from '../utils/validation.js'
import { getContributorEvents } from '../services/contributor-events.service.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/contributor/:wallet/events
 * 
 * Obtiene todos los eventos relacionados con un contribuidor:
 * - Estudios subidos
 * - Pagos recibidos (RevenueSplitter events)
 * - Uso en datasets
 * - Total ganado
 * 
 * Headers:
 * - x-wallet-address: Stellar wallet address (opcional, puede venir en params)
 * 
 * Params:
 * - wallet: Stellar wallet address del contribuidor
 */
router.get('/:wallet/events', async (req, res) => {
  try {
    // Get wallet from params or header
    let walletAddress: string

    if (req.params.wallet) {
      // Validate wallet address format
      try {
        walletAddress = WalletAddressSchema.parse(req.params.wallet)
      } catch (error: any) {
        logger.warn('Invalid wallet address in params', {
          wallet: req.params.wallet,
          error: error.message,
        })
        return res.status(400).json({
          error: 'Invalid wallet address format',
          message: 'Wallet address must be a valid Stellar address (starts with G)',
        })
      }
    } else {
      // Try to get from header
      try {
        walletAddress = WalletAddressSchema.parse(
          req.headers['x-wallet-address'] as string
        )
      } catch (error: any) {
        return res.status(400).json({
          error: 'Wallet address required',
          message: 'Provide wallet address in params or x-wallet-address header',
        })
      }
    }

    logger.info('Fetching contributor events', {
      walletAddress: walletAddress.substring(0, 8) + '...',
    })

    // Fetch events from blockchain and backend
    const events = await getContributorEvents(walletAddress)

    logger.info('Contributor events fetched successfully', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      studiesCount: events.studies.length,
      payoutsCount: events.payouts.length,
      totalEarned: events.totalEarnedUSDC,
    })

    // Log full response for developers
    console.log('📡 Contributor Dashboard Data (Backend):', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      studies: events.studies,
      payouts: events.payouts,
      totalEarnedUSDC: events.totalEarnedUSDC,
      datasetUsage: events.datasetUsage,
    })

    res.json(events)
  } catch (error: any) {
    logger.error('Error fetching contributor events', {
      error: error.message,
      stack: error.stack,
      wallet: req.params.wallet,
    })

    res.status(500).json({
      error: 'Internal server error',
      message: 'Error fetching contributor events',
    })
  }
})

export default router

