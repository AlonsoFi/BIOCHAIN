/**
 * Soroban Service
 * 
 * High-level service for Soroban contract interactions.
 * Provides business logic methods for:
 * - Registering studies
 * - Registering datasets
 * - Purchasing datasets
 */

import {
  prepareContractCall,
  signWithAAWallet,
  submitToSoroban,
} from '../lib/sorobanClient.js'
import logger from '../utils/logger.js'
import { xdr } from 'soroban-client'

// Contract IDs
const CONTRACT_IDS = {
  STUDY_REGISTRY: process.env.CONTRACT_STUDY_REGISTRY || '',
  DATASET_MARKETPLACE: process.env.CONTRACT_MARKETPLACE || '',
  REVENUE_SPLITTER: process.env.CONTRACT_REVENUE_SPLITTER || '',
}

/**
 * Register a study on-chain
 * 
 * Calls StudyRegistry.register_study() with:
 * - dataset_hash (BytesN<32>)
 * - attestation (Bytes)
 * - zk_proof (Bytes)
 * - contributor (Address)
 * 
 * @param params - Registration parameters
 * @returns Transaction hash and study ID
 */
export const registerStudyOnChain = async (params: {
  datasetHash: string // Hex string (64 chars)
  attestation: string
  zkProof: string
  contributorAddress: string
  secretKey?: string // Optional, for signing
}): Promise<{
  transactionHash: string
  studyId: string
}> => {
  const { datasetHash, attestation, zkProof, contributorAddress, secretKey } = params

  logger.info('Registering study on-chain', {
    datasetHash: datasetHash.substring(0, 16) + '...',
    contributorAddress: contributorAddress.substring(0, 8) + '...',
  })

  // Validate contract ID
  if (!CONTRACT_IDS.STUDY_REGISTRY) {
    throw new Error('STUDY_REGISTRY contract ID not configured')
  }

  try {
    // Convert parameters to XDR ScVal
    const hashBuffer = Buffer.from(datasetHash, 'hex')
    if (hashBuffer.length !== 32) {
      throw new Error(`Invalid dataset hash length: expected 32 bytes, got ${hashBuffer.length}`)
    }

    const args = [
      xdr.ScVal.scvBytes(hashBuffer), // dataset_hash: BytesN<32>
      xdr.ScVal.scvBytes(Buffer.from(attestation, 'utf-8')), // attestation: Bytes
      xdr.ScVal.scvBytes(Buffer.from(zkProof, 'utf-8')), // zk_proof: Bytes
      addressToScVal(contributorAddress), // contributor: Address
    ]

    // Prepare transaction (args are already XDR ScVal)
    const txXdr = await prepareContractCall(
      CONTRACT_IDS.STUDY_REGISTRY,
      'register_study',
      args, // Pass XDR ScVal array directly
      contributorAddress
    )

    // Sign transaction
    const signedTxXdr = await signWithAAWallet(txXdr, contributorAddress, secretKey)

    // Submit to Soroban
    const result = await submitToSoroban(signedTxXdr)

    logger.info('Study registered on-chain', {
      transactionHash: result.transactionHash,
      datasetHash: datasetHash.substring(0, 16) + '...',
    })

    return {
      transactionHash: result.transactionHash,
      studyId: datasetHash, // Use dataset hash as study ID
    }
  } catch (error: any) {
    logger.error('Failed to register study on-chain', {
      error: error.message,
      stack: error.stack,
      datasetHash: datasetHash.substring(0, 16) + '...',
    })
    throw handleSorobanError(error)
  }
}

/**
 * Register a dataset on-chain
 * 
 * Calls DatasetMarketplace.register_dataset() with:
 * - dataset_id (Bytes)
 * - study_ids (Vec<Bytes>)
 * - price_usdc (i128)
 * 
 * @param params - Registration parameters
 * @returns Transaction hash
 */
export const registerDatasetOnChain = async (params: {
  datasetId: string
  studyIds: string[] // Array of hex hashes (32 bytes each)
  priceUsdc: number // Price in USDC (will be converted to i128 with 7 decimals)
  ownerAddress: string
  secretKey?: string
}): Promise<{
  transactionHash: string
}> => {
  const { datasetId, studyIds, priceUsdc, ownerAddress, secretKey } = params

  logger.info('Registering dataset on-chain', {
    datasetId,
    studyCount: studyIds.length,
    priceUsdc,
    ownerAddress: ownerAddress.substring(0, 8) + '...',
  })

  // Validate contract ID
  if (!CONTRACT_IDS.DATASET_MARKETPLACE) {
    throw new Error('DATASET_MARKETPLACE contract ID not configured')
  }

  try {
    // Convert price to i128 (7 decimals for Stellar)
    const priceI128 = BigInt(Math.floor(priceUsdc * 1_0000000))

    // Convert study IDs to Bytes ScVal array
    const studyIdsScVal = studyIds.map((studyId) => {
      const buffer = Buffer.from(studyId, 'hex')
      if (buffer.length !== 32) {
        throw new Error(`Invalid study ID length: expected 32 bytes, got ${buffer.length}`)
      }
      return xdr.ScVal.scvBytes(buffer)
    })

    // Build args
    const args = [
      xdr.ScVal.scvBytes(Buffer.from(datasetId, 'utf-8')), // dataset_id: Bytes
      xdr.ScVal.scvVec(studyIdsScVal), // study_ids: Vec<Bytes>
      xdr.ScVal.scvI128(xdr.Int128Parts.fromString(priceI128.toString())), // price_usdc: i128
    ]

    // Prepare transaction (args are already XDR ScVal)
    const txXdr = await prepareContractCall(
      CONTRACT_IDS.DATASET_MARKETPLACE,
      'register_dataset',
      args, // Pass XDR ScVal array directly
      ownerAddress
    )

    // Sign transaction
    const signedTxXdr = await signWithAAWallet(txXdr, ownerAddress, secretKey)

    // Submit to Soroban
    const result = await submitToSoroban(signedTxXdr)

    logger.info('Dataset registered on-chain', {
      transactionHash: result.transactionHash,
      datasetId,
    })

    return {
      transactionHash: result.transactionHash,
    }
  } catch (error: any) {
    logger.error('Failed to register dataset on-chain', {
      error: error.message,
      stack: error.stack,
      datasetId,
    })
    throw handleSorobanError(error)
  }
}

/**
 * Purchase a dataset on-chain
 * 
 * Calls DatasetMarketplace.purchase_dataset() with:
 * - dataset_id (Bytes)
 * - buyer (Address)
 * 
 * This will automatically trigger RevenueSplitter to distribute payouts.
 * 
 * @param params - Purchase parameters
 * @returns Transaction hash and purchase info
 */
export const purchaseDatasetOnChain = async (params: {
  datasetId: string
  buyerAddress: string
  secretKey?: string
}): Promise<{
  transactionHash: string
  datasetId: string
  priceUsdc: number
}> => {
  const { datasetId, buyerAddress, secretKey } = params

  logger.info('Purchasing dataset on-chain', {
    datasetId,
    buyerAddress: buyerAddress.substring(0, 8) + '...',
  })

  // Validate contract ID
  if (!CONTRACT_IDS.DATASET_MARKETPLACE) {
    throw new Error('DATASET_MARKETPLACE contract ID not configured')
  }

  try {
    // Note: Balance verification would require:
    // 1. USDC token contract address (from env: USDC_TOKEN_ADDRESS)
    // 2. Query token.balance(buyerAddress) using soroban-client
    // 3. Compare with dataset.priceUsdc
    // For now, the contract will handle validation and fail if insufficient funds
    // This is acceptable for hackathon - in production, add balance check here for better UX

    // Build args
    const args = [
      xdr.ScVal.scvBytes(Buffer.from(datasetId, 'utf-8')), // dataset_id: Bytes
      addressToScVal(buyerAddress), // buyer: Address
    ]

    // Prepare transaction (args are already XDR ScVal)
    const txXdr = await prepareContractCall(
      CONTRACT_IDS.DATASET_MARKETPLACE,
      'purchase_dataset',
      args, // Pass XDR ScVal array directly
      buyerAddress
    )

    // Sign transaction
    const signedTxXdr = await signWithAAWallet(txXdr, buyerAddress, secretKey)

    // Submit to Soroban
    const result = await submitToSoroban(signedTxXdr)

    logger.info('Dataset purchased on-chain', {
      transactionHash: result.transactionHash,
      datasetId,
    })

    // Parse result to get dataset info
    // The contract returns Dataset struct, but we'll extract what we need
    let priceUsdc = 0
    if (result.decodedOutput) {
      // Try to extract price from decoded output
      // This depends on the contract's return type
      priceUsdc = result.decodedOutput.price_usdc || 0
    }

    return {
      transactionHash: result.transactionHash,
      datasetId,
      priceUsdc,
    }
  } catch (error: any) {
    logger.error('Failed to purchase dataset on-chain', {
      error: error.message,
      stack: error.stack,
      datasetId,
    })
    throw handleSorobanError(error)
  }
}

/**
 * Helper: Convert Address string to Address ScVal
 */
const addressToScVal = (address: string): xdr.ScVal => {
  try {
    const { Keypair } = require('@stellar/stellar-sdk')
    const keypair = Keypair.fromPublicKey(address)
    const accountId = xdr.PublicKey.publicKeyTypeEd25519(keypair.rawPublicKey())
    const scAddress = xdr.ScAddress.scAddressTypeAccount(accountId)
    return xdr.ScVal.scvAddress(scAddress)
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`)
  }
}

