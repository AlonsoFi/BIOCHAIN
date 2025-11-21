/**
 * Soroban Routes
 * 
 * Routes for on-chain operations:
 * - Register study on-chain
 * - Register dataset on-chain
 * - Purchase dataset on-chain
 */

import express from 'express'
import { WalletAddressSchema, validateHeader } from '../utils/validation.js'
import {
  registerStudyOnChain,
  registerDatasetOnChain,
  purchaseDatasetOnChain,
} from '../services/soroban.service.js'
import { handleSorobanError } from '../lib/sorobanClient.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * POST /api/soroban/register-study
 * 
 * Registers a study on-chain after processing through CVM + ZK-Prover
 * 
 * Body:
 * - datasetHash: string (hex, 64 chars)
 * - attestation: string
 * - zkProof: string
 * - secretKey?: string (optional, for signing)
 * 
 * Headers:
 * - x-wallet-address: Stellar wallet address
 */
router.post('/register-study', async (req, res) => {
  try {
    // Validate wallet address
    const contributorAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    // Validate body
    const { datasetHash, attestation, zkProof, secretKey } = req.body

    if (!datasetHash || !attestation || !zkProof) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'datasetHash, attestation, and zkProof are required',
      })
    }

    // Validate dataset hash format (64 hex chars = 32 bytes)
    if (!/^[0-9a-fA-F]{64}$/.test(datasetHash)) {
      return res.status(400).json({
        error: 'Invalid dataset hash format',
        message: 'datasetHash must be a 64-character hex string',
      })
    }

    logger.info('Registering study on-chain', {
      datasetHash: datasetHash.substring(0, 16) + '...',
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    // Register on-chain
    const result = await registerStudyOnChain({
      datasetHash,
      attestation,
      zkProof,
      contributorAddress,
      secretKey, // Optional, for signing
    })

    logger.info('Study registered on-chain successfully', {
      transactionHash: result.transactionHash,
      studyId: result.studyId.substring(0, 16) + '...',
    })

    res.json({
      success: true,
      transactionHash: result.transactionHash,
      studyId: result.studyId,
      message: 'Study registered on-chain successfully',
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error in register-study', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }

    const sorobanError = handleSorobanError(error)
    logger.error('Error registering study on-chain', {
      error: sorobanError.message,
      code: sorobanError.code,
      stack: error.stack,
    })

    res.status(sorobanError.statusCode || 500).json({
      error: sorobanError.code || 'SOROBAN_ERROR',
      message: sorobanError.message,
    })
  }
})

/**
 * POST /api/soroban/register-dataset
 * 
 * Registers a dataset in the marketplace
 * 
 * Body:
 * - datasetId: string
 * - studyIds: string[] (array of hex hashes, 64 chars each)
 * - priceUsdc: number
 * - secretKey?: string (optional, for signing)
 * 
 * Headers:
 * - x-wallet-address: Stellar wallet address (owner)
 */
router.post('/register-dataset', async (req, res) => {
  try {
    // Validate wallet address
    const ownerAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    // Validate body
    const { datasetId, studyIds, priceUsdc, secretKey } = req.body

    if (!datasetId || !studyIds || !Array.isArray(studyIds) || priceUsdc === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'datasetId, studyIds (array), and priceUsdc are required',
      })
    }

    if (studyIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid studyIds',
        message: 'studyIds must contain at least one study hash',
      })
    }

    // Validate study IDs format
    for (const studyId of studyIds) {
      if (!/^[0-9a-fA-F]{64}$/.test(studyId)) {
        return res.status(400).json({
          error: 'Invalid study ID format',
          message: `Study ID "${studyId.substring(0, 16)}..." must be a 64-character hex string`,
        })
      }
    }

    if (priceUsdc <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'priceUsdc must be greater than 0',
      })
    }

    logger.info('Registering dataset on-chain', {
      datasetId,
      studyCount: studyIds.length,
      priceUsdc,
      ownerAddress: ownerAddress.substring(0, 8) + '...',
    })

    // Register on-chain
    const result = await registerDatasetOnChain({
      datasetId,
      studyIds,
      priceUsdc,
      ownerAddress,
      secretKey, // Optional, for signing
    })

    logger.info('Dataset registered on-chain successfully', {
      transactionHash: result.transactionHash,
      datasetId,
    })

    res.json({
      success: true,
      transactionHash: result.transactionHash,
      datasetId,
      message: 'Dataset registered on-chain successfully',
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error in register-dataset', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }

    const sorobanError = handleSorobanError(error)
    logger.error('Error registering dataset on-chain', {
      error: sorobanError.message,
      code: sorobanError.code,
      stack: error.stack,
    })

    res.status(sorobanError.statusCode || 500).json({
      error: sorobanError.code || 'SOROBAN_ERROR',
      message: sorobanError.message,
    })
  }
})

/**
 * POST /api/soroban/purchase-dataset
 * 
 * Purchases a dataset on-chain
 * 
 * Body:
 * - datasetId: string
 * - secretKey?: string (optional, for signing)
 * 
 * Headers:
 * - x-wallet-address: Stellar wallet address (buyer)
 */
router.post('/purchase-dataset', async (req, res) => {
  try {
    // Validate wallet address
    const buyerAddress = validateHeader(WalletAddressSchema)(
      req.headers['x-wallet-address'] as string
    )

    // Validate body
    const { datasetId, secretKey } = req.body

    if (!datasetId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'datasetId is required',
      })
    }

    logger.info('Purchasing dataset on-chain', {
      datasetId,
      buyerAddress: buyerAddress.substring(0, 8) + '...',
    })

    // Purchase on-chain
    const result = await purchaseDatasetOnChain({
      datasetId,
      buyerAddress,
      secretKey, // Optional, for signing
    })

    logger.info('Dataset purchased on-chain successfully', {
      transactionHash: result.transactionHash,
      datasetId,
      priceUsdc: result.priceUsdc,
    })

    res.json({
      success: true,
      transactionHash: result.transactionHash,
      datasetId: result.datasetId,
      priceUsdc: result.priceUsdc,
      message: 'Dataset purchased on-chain successfully',
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Validation error in purchase-dataset', { errors: error.errors })
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }

    const sorobanError = handleSorobanError(error)
    logger.error('Error purchasing dataset on-chain', {
      error: sorobanError.message,
      code: sorobanError.code,
      stack: error.stack,
    })

    res.status(sorobanError.statusCode || 500).json({
      error: sorobanError.code || 'SOROBAN_ERROR',
      message: sorobanError.message,
    })
  }
})

export default router

