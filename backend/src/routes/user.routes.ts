import express from 'express'
import { saveHistoriaClinica, getHistoriaClinica } from '../services/user.service.js'
import { HistoriaClinicaSchema, WalletAddressSchema, validateBody, validateHeader } from '../utils/validation.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * POST /api/user/history
 * Guarda historia clínica del usuario
 */
router.post('/history', (req, res) => {
  try {
    // Validar wallet address
    const walletAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    // Validar body con Zod
    const validatedData = validateBody(HistoriaClinicaSchema)(req.body)

    logger.info('Saving clinical history', {
      walletAddress: walletAddress.substring(0, 8) + '...', // Log parcial por privacidad
    })

    const result = saveHistoriaClinica(walletAddress, validatedData)
    res.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    logger.error('Error saving history', { error: error.message, stack: error.stack })
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/user/history
 * Obtiene historia clínica del usuario
 */
router.get('/history', (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' })
    }

    const history = getHistoriaClinica(walletAddress)
    if (!history) {
      return res.status(404).json({ error: 'History not found' })
    }

    res.json(history)
  } catch (error: any) {
    logger.error('Error getting history', {
      error: error.message,
      stack: error.stack,
      walletAddress: req.headers['x-wallet-address']?.toString().substring(0, 8) + '...',
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

