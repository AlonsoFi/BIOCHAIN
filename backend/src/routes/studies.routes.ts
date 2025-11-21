import express from 'express'
import { WalletAddressSchema, validateHeader } from '../utils/validation.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/studies
 * Obtiene estudios del usuario
 */
router.get('/', (req, res) => {
  try {
    // Validar wallet address
    const walletAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    logger.info('Fetching user studies', {
      walletAddress: walletAddress.substring(0, 8) + '...',
    })

    // Mock data para demo
    const studies = [
      {
        id: 'study_1',
        name: 'Análisis hormonal completo',
        date: '2025-01-15',
        type: 'Hemograma + perfil hormonal',
        sales: 2,
        earnings: 240,
        datasetHash: 'abc123...',
      },
      {
        id: 'study_2',
        name: 'Hemograma completo',
        date: '2024-12-10',
        type: 'Hemograma básico',
        sales: 1,
        earnings: 120,
        datasetHash: 'def456...',
      },
      {
        id: 'study_3',
        name: 'Perfil tiroideo',
        date: '2024-11-05',
        type: 'TSH, T3, T4',
        sales: 0,
        earnings: 0,
        datasetHash: 'ghi789...',
      },
    ]

    logger.info('Studies fetched', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      count: studies.length,
    })
    res.json(studies)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    logger.error('Error getting studies', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

