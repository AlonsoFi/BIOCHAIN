import express from 'express'
import { WalletAddressSchema, validateHeader } from '../utils/validation.js'
import { getUserStudies, saveUserStudy } from '../services/studies.service.js'
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

    // Obtener estudios reales del usuario
    const studies = getUserStudies(walletAddress)

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

/**
 * POST /api/studies
 * Guarda un estudio del usuario después del upload
 */
router.post('/', (req, res) => {
  try {
    // Validar wallet address
    const walletAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    // Validar body
    const { name, type, datasetHash, txHash } = req.body

    if (!name || !type || !datasetHash) {
      return res.status(400).json({ error: 'Missing required fields: name, type, datasetHash' })
    }

    logger.info('Saving user study', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      name,
      datasetHash: datasetHash.substring(0, 16) + '...',
    })

    const study = saveUserStudy(walletAddress, {
      name,
      type,
      datasetHash,
      txHash,
    })

    logger.info('Study saved', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      studyId: study.id,
    })

    res.json(study)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    logger.error('Error saving study', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

