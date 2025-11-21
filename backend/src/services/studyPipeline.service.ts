/**
 * Study Processing Pipeline
 * 
 * Complete pipeline: PDF → NVIDIA CVM → ZK-Prover → Ready for Chain
 * 
 * This service orchestrates the entire processing flow:
 * 1. Process encrypted PDF in NVIDIA CVM (mock/real)
 * 2. Receive dataset_hash, summary_metadata, attestation_proof
 * 3. Verify duplicate (anti-duplicate check)
 * 4. Generate ZK proof
 * 5. Package final object ready for Soroban
 * 
 * IMPORTANT:
 * - Never stores PDFs
 * - Destroys buffers immediately
 * - Works with encrypted uploads
 * - No PII in logs or DB
 */

import { processPDF, getCVMConfig } from './cvm.service.js'
import { generateZKProof } from './zk-prover/index.js'
import { assertNotDuplicate } from './study-duplicate.service.js'
import { registerHash } from './deduplication.service.js'
import { DuplicateStudyError } from '../errors/DuplicateStudyError.js'
import logger from '../utils/logger.js'

/**
 * Output from CVM processing
 */
export interface CvmOutput {
  datasetHash: string
  summaryMetadata: {
    age: string
    condition: string
    population?: string
    biomarkers?: {
      glucose?: string
      hemoglobin?: string
      cholesterol?: string
    }
    labInfo?: {
      labName: string
      labType: string
    }
  }
  attestationProof: string
  mode: 'real' | 'mock'
}

/**
 * Output from ZK-Prover
 */
export interface ZkOutput {
  zkProof: string
  publicInputs: string[]
  verificationKey?: string
}

/**
 * Final pipeline output ready for Soroban
 */
export interface PipelineOutput {
  status: 'processed'
  datasetHash: string
  summaryMetadata: CvmOutput['summaryMetadata']
  attestationProof: string
  zkProof: string
  publicInputs: string[]
  contributorAddress: string
  timestamp: number
}

/**
 * Input to the pipeline
 */
export interface PipelineInput {
  /** Encrypted PDF buffer (will be destroyed after processing) */
  encryptedPDFBuffer: Buffer
  /** Contributor's wallet address (Stellar address) */
  contributorAddress: string
  /** Optional filename for logging (no PII) */
  filename?: string
}

/**
 * Process a study through the complete pipeline
 * 
 * Flow:
 * 1. Process PDF in NVIDIA CVM → get dataset_hash, metadata, attestation
 * 2. Verify duplicate (throw if duplicate)
 * 3. Generate ZK proof
 * 4. Register hash (for future duplicate detection)
 * 5. Package final object
 * 
 * @param input - Pipeline input (encrypted PDF buffer + contributor address)
 * @returns Final object ready to be sent to Soroban
 * @throws DuplicateStudyError if study already exists
 */
export const processStudy = async (input: PipelineInput): Promise<PipelineOutput> => {
  const { encryptedPDFBuffer, contributorAddress, filename } = input
  const startTime = Date.now()

  logger.info('Starting study processing pipeline', {
    contributorAddress: contributorAddress.substring(0, 8) + '...',
    filename: filename || 'unknown',
    bufferSize: encryptedPDFBuffer.length,
  })

  // Create a copy of the buffer for CVM (original will be destroyed)
  let bufferCopy: Buffer | null = null
  let pdfBuffer: Buffer | null = null

  try {
    // ============================================
    // STEP 1: Process in NVIDIA CVM
    // ============================================
    logger.info('Step 1: Processing PDF in NVIDIA CVM', {
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    bufferCopy = Buffer.from(encryptedPDFBuffer)
    pdfBuffer = encryptedPDFBuffer

    const cvmConfig = getCVMConfig()
    const cvmResponse = await processPDF({
      encryptedPDFBuffer: bufferCopy,
      config: cvmConfig,
    })

    // Extract CVM result (CVMProcessResponse extends CVMProcessResult)
    const cvmResult: CvmOutput = {
      datasetHash: cvmResponse.datasetHash,
      summaryMetadata: cvmResponse.summaryMetadata,
      attestationProof: cvmResponse.attestationProof,
      mode: cvmResponse.mode,
    }

    logger.info('CVM processing completed', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      mode: cvmResult.mode,
      fallbackUsed: cvmResponse.fallbackUsed || false,
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    // Destroy CVM buffer copy immediately
    if (bufferCopy) {
      bufferCopy.fill(0)
      bufferCopy = null
    }

    // ============================================
    // STEP 2: Verify Duplicate (Anti-duplicate check)
    // ============================================
    logger.info('Step 2: Verifying duplicate', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    try {
      await assertNotDuplicate(cvmResult.datasetHash)
    } catch (error) {
      // Destroy PDF buffer before throwing
      if (pdfBuffer) {
        pdfBuffer.fill(0)
        pdfBuffer = null
      }

      if (error instanceof DuplicateStudyError) {
        logger.warn('Duplicate study detected in pipeline', {
          datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
          contributorAddress: contributorAddress.substring(0, 8) + '...',
        })
        throw error
      }
      throw error
    }

    logger.info('Duplicate check passed', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
    })

    // ============================================
    // STEP 3: Generate ZK Proof
    // ============================================
    logger.info('Step 3: Generating ZK proof', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    const zkResult = await generateZKProof({
      datasetHash: cvmResult.datasetHash,
      attestationProof: cvmResult.attestationProof,
    })

    logger.info('ZK proof generated', {
      proofLength: zkResult.proof.length,
      publicInputsCount: zkResult.publicInputs.length,
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
    })

    // ============================================
    // STEP 4: Register Hash (for future duplicate detection)
    // ============================================
    logger.info('Step 4: Registering dataset hash', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
    })

    registerHash(cvmResult.datasetHash)

    // ============================================
    // STEP 5: Destroy PDF Buffer (Security)
    // ============================================
    if (pdfBuffer) {
      pdfBuffer.fill(0)
      pdfBuffer = null
    }

    // ============================================
    // STEP 6: Package Final Object
    // ============================================
    const duration = Date.now() - startTime
    const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp

    const finalOutput: PipelineOutput = {
      status: 'processed',
      datasetHash: cvmResult.datasetHash,
      summaryMetadata: cvmResult.summaryMetadata,
      attestationProof: cvmResult.attestationProof,
      zkProof: zkResult.proof,
      publicInputs: zkResult.publicInputs,
      contributorAddress,
      timestamp,
    }

    logger.info('Study processing pipeline completed', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      contributorAddress: contributorAddress.substring(0, 8) + '...',
      duration: `${duration}ms`,
      mode: cvmResult.mode,
    })

    return finalOutput
  } catch (error: any) {
    // Ensure buffers are destroyed on error
    if (bufferCopy) {
      bufferCopy.fill(0)
      bufferCopy = null
    }
    if (pdfBuffer) {
      pdfBuffer.fill(0)
      pdfBuffer = null
    }

    logger.error('Study processing pipeline failed', {
      error: error.message,
      stack: error.stack,
      contributorAddress: contributorAddress.substring(0, 8) + '...',
      code: error.code,
    })

    throw error
  }
}

