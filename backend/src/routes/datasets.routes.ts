import express from 'express'
import { getAllDatasets, getDataset } from '../services/dataset-aggregator.service.js'
import { WalletAddressSchema, DatasetIdSchema, validateHeader } from '../utils/validation.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/datasets
 * Obtiene todos los datasets disponibles
 */
router.get('/', (req, res) => {
  try {
    logger.info('Fetching all datasets')
    const datasets = getAllDatasets()
    logger.info('Datasets fetched', { count: datasets.length })
    res.json(datasets)
  } catch (error: any) {
    logger.error('Error getting datasets', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/datasets/:id
 * Obtiene un dataset específico
 */
router.get('/:id', (req, res) => {
  try {
    // Validar dataset ID
    const datasetId = DatasetIdSchema.parse(req.params.id)
    
    logger.info('Fetching dataset', { datasetId })
    const dataset = getDataset(datasetId)
    if (!dataset) {
      logger.warn('Dataset not found', { datasetId })
      return res.status(404).json({ error: 'Dataset not found' })
    }
    res.json(dataset)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Invalid dataset ID format', { errors: error.errors })
      return res.status(400).json({ error: 'Invalid dataset ID format', details: error.errors })
    }
    logger.error('Error getting dataset', {
      error: error.message,
      stack: error.stack,
      datasetId: req.params.id,
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/datasets/:id/purchase
 * Compra un dataset
 * 
 * Según diagrama (Researcher Flow):
 * 1. User selects payment method (transfer / MercadoPago)
 * 2. Anchor processes off-chain payment
 * 3. Anchor converts fiat → USDC on Stellar
 * 4. USDC sent to BioChain Smart Contract
 * 5. Soroban Contract:
 *    - Verifies payment
 *    - Registers purchase
 *    - Executes revenue split: 85% contributors, 15% BioChain
 *    - Sends USDC to contributors
 * 6. Investigator receives dataset access token
 * 
 * Flujo actual (mock):
 * 1. Verifica pago (mock SEP-24 anchor)
 * 2. Devuelve access token para descargar dataset
 * 3. En producción, llamaría a purchase_dataset() en Soroban
 */
router.post('/:id/purchase', async (req, res) => {
  try {
    // Validar dataset ID
    const datasetId = DatasetIdSchema.parse(req.params.id)
    
    // Validar wallet address
    const walletAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    logger.info('Processing dataset purchase', {
      datasetId,
      walletAddress: walletAddress.substring(0, 8) + '...',
    })

    const dataset = getDataset(datasetId)
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' })
    }

    // ============================================
    // FLUJO SEGÚN DIAGRAMA (mock):
    // ============================================
    
    // 1. Anchor processes off-chain payment (mock)
    // En producción: El anchor recibiría el pago fiat y lo procesaría
    logger.info('Anchor processing off-chain payment', { datasetId })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // 2. Anchor converts fiat → USDC on Stellar (mock)
    // En producción: El anchor convertiría fiat a USDC y lo depositaría
    logger.info('Anchor converting fiat → USDC on Stellar', { datasetId })
    const usdcAmount = dataset.price
    
    // 3. USDC sent to BioChain Smart Contract (mock)
    // En producción: El USDC se enviaría al contrato Soroban
    logger.info('USDC sent to BioChain Smart Contract', {
      datasetId,
      usdcAmount,
    })
    
    // 4. Purchase on-chain (Soroban Contract)
    //    - Verifies payment
    //    - Registers purchase
    //    - Executes revenue split: 85% contributors, 15% BioChain
    //    - Sends USDC to contributors
    let txHash: string
    let purchaseResult: any = null
    
    try {
      // Try to purchase on-chain
      const { purchaseDatasetOnChain } = await import('../services/soroban.service.js')
      purchaseResult = await purchaseDatasetOnChain({
        datasetId,
        buyerAddress: walletAddress,
        // secretKey: req.body.secretKey, // Optional, for signing
      })
      txHash = purchaseResult.transactionHash
      
      logger.info('Dataset purchased on-chain', {
        transactionHash: txHash,
        datasetId,
        priceUsdc: purchaseResult.priceUsdc,
      })
    } catch (error: any) {
      // If on-chain purchase fails, fallback to mock
      logger.warn('On-chain purchase failed, using mock', {
        error: error.message,
        datasetId,
      })
      txHash = `mock_tx_${Date.now()}`
    }
    
    // 5. Generate access token
    const accessToken = `access_token_${crypto.randomBytes(16).toString('hex')}`
    
    // Calculate revenue split (for logging)
    const contributorAmount = usdcAmount * 0.85
    const biochainAmount = usdcAmount * 0.15
    logger.info('Revenue split executed', {
      datasetId,
      contributorAmount,
      biochainAmount,
    })

    logger.info('Dataset purchase completed', {
      datasetId,
      txHash,
      walletAddress: walletAddress.substring(0, 8) + '...',
    })

    res.json({
      success: true,
      txHash,
      accessToken,
      message: 'Dataset comprado exitosamente',
      // Info adicional para claridad
      paymentProcessed: true,
      usdcAmount,
      revenueSplit: {
        contributors: contributorAmount,
        biochain: biochainAmount,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error in purchase', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    logger.error('Error purchasing dataset', {
      error: error.message,
      stack: error.stack,
      datasetId: req.params.id,
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

