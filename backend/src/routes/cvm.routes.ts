import express from 'express'
import multer from 'multer'
import { processPDF, getCVMConfig } from '../services/cvm.service.js'
import { generateZKProof } from '../services/zk-prover/index.js'
import { registerHash } from '../services/deduplication.service.js'
import { assertNotDuplicate } from '../services/study-duplicate.service.js'
import { DuplicateStudyError } from '../errors/DuplicateStudyError.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Configurar multer para archivos temporales
const upload = multer({
  storage: multer.memoryStorage(), // NO guardar en disco, solo en memoria
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar PDFs e imágenes
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten PDFs e imágenes'))
    }
  },
})

/**
 * POST /api/cvm/process
 * Procesa archivo en CVM (NVIDIA TEE) con anti-duplicado
 * 
 * Flujo:
 * 1. Recibe PDF cifrado
 * 2. Procesa en CVM (REAL o MOCK según configuración)
 * 3. Verifica duplicado (hash ya existe)
 * 4. Genera ZK proof
 * 5. Devuelve hash, metadata, attestation, zk_proof
 * 
 * IMPORTANTE: 
 * - El archivo NO se guarda, solo se procesa
 * - PII nunca sale del TEE
 * - Duplicados son rechazados
 */
router.post('/process', upload.single('file'), async (req, res, next) => {
  let pdfBuffer: Buffer | null = null

  try {
    if (!req.file) {
      logger.warn('File upload attempt without file')
      return res.status(400).json({ error: 'No file provided' })
    }

    pdfBuffer = req.file.buffer

    logger.info('Processing file in CVM', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })

    // 1. Procesar en CVM (REAL o MOCK según CVM_MODE)
    const cvmConfig = getCVMConfig()
    
    // Crear copia del buffer para CVM (el original se destruirá después)
    const bufferCopy = Buffer.from(pdfBuffer)

    const cvmResult = await processPDF({
      encryptedPDFBuffer: bufferCopy,
      config: cvmConfig,
    })

    logger.info('CVM processing completed', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      mode: cvmResult.mode,
      fallbackUsed: cvmResult.fallbackUsed || false,
    })

    // 2. Verificar duplicado (ANTI-DUPLICADO - Paso B y C)
    // IMPORTANTE: Esto debe ejecutarse ANTES de generar ZK proof y registrar en blockchain
    try {
      await assertNotDuplicate(cvmResult.datasetHash)
    } catch (error) {
      // Si es DuplicateStudyError, destruir buffer y retornar error
      if (error instanceof DuplicateStudyError) {
        pdfBuffer.fill(0)
        throw error // Será manejado por el error handler
      }
      // Re-lanzar otros errores
      throw error
    }

    // 3. Generar ZK proof (solo si no es duplicado)
    // IMPORTANTE: Solo pasamos dataset_hash y attestation_proof
    // NO contributor_id, NO timestamps, NO PII, NO metadata
    const zkProof = await generateZKProof({
      datasetHash: cvmResult.datasetHash,
      attestationProof: cvmResult.attestationProof,
    })

    logger.info('ZK proof generated', {
      proofLength: zkProof.proof.length,
      publicInputsCount: zkProof.publicInputs.length,
    })

    // 4. Registrar hash (después de verificar que no es duplicado)
    registerHash(cvmResult.datasetHash)

    // 5. Destruir buffer original (sobreescribir con ceros)
    pdfBuffer.fill(0)
    pdfBuffer = null

    // Retornar resultado al frontend
    // IMPORTANTE: NO incluir PII, solo datos anonimizados
    res.json({
      datasetHash: cvmResult.datasetHash,
      summaryMetadata: cvmResult.summaryMetadata,
      attestationProof: cvmResult.attestationProof,
      zkProof: zkProof.proof,
      publicInputs: zkProof.publicInputs,
      duplicateCheck: 'passed',
    })
  } catch (error: any) {
    // Destruir buffer en caso de error
    if (pdfBuffer) {
      pdfBuffer.fill(0)
    }

    // DuplicateStudyError será manejado por el error handler middleware
    if (error instanceof DuplicateStudyError) {
      // Pasar al siguiente middleware (error handler)
      return next(error)
    }

    // Manejar errores específicos de CVM
    if (error.code === 'TIMEOUT' || error.code === 'QUOTA' || error.code === 'NETWORK_ERROR') {
      logger.error('CVM error', {
        code: error.code,
        message: error.message,
        fallbackAvailable: error.fallbackAvailable,
      })

      if (error.fallbackAvailable) {
        return res.status(503).json({
          error: 'CVM service unavailable',
          message: 'El servicio CVM no está disponible. Por favor, intenta de nuevo.',
          code: error.code,
          fallbackAvailable: true,
        })
      }
    }

    // Pasar otros errores al error handler
    next(error)
  }
})

export default router

