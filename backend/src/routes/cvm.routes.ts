import express from 'express'
import multer from 'multer'
import { processStudy } from '../services/studyPipeline.service.js'
import { DuplicateStudyError } from '../errors/DuplicateStudyError.js'
import { WalletAddressSchema, validateHeader } from '../utils/validation.js'
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
 * Procesa archivo en CVM (NVIDIA TEE) con pipeline completo
 * 
 * Pipeline completo:
 * 1. Recibe PDF cifrado
 * 2. Procesa en CVM (REAL o MOCK según configuración)
 * 3. Verifica duplicado (hash ya existe)
 * 4. Genera ZK proof
 * 5. Retorna objeto final listo para Soroban
 * 
 * IMPORTANTE: 
 * - El archivo NO se guarda, solo se procesa
 * - PII nunca sale del TEE
 * - Duplicados son rechazados
 * - Buffers se destruyen inmediatamente
 */
router.post('/process', upload.single('file'), async (req, res, next) => {
  try {
    // Validar archivo
    if (!req.file) {
      logger.warn('File upload attempt without file')
      return res.status(400).json({ error: 'No file provided' })
    }

    // Validar wallet address (contributor)
    let contributorAddress: string
    try {
      contributorAddress = validateHeader(WalletAddressSchema)(
        req.headers['x-wallet-address'] as string
      )
    } catch (error: any) {
      logger.warn('Invalid or missing wallet address', {
        error: error.message,
      })
      return res.status(400).json({ 
        error: 'Wallet address required',
        message: 'x-wallet-address header is required and must be a valid Stellar address',
      })
    }

    logger.info('Starting study upload', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    // Ejecutar pipeline completo
    const result = await processStudy({
      encryptedPDFBuffer: req.file.buffer,
      contributorAddress,
      filename: req.file.originalname,
    })

    logger.info('Study processing completed successfully', {
      datasetHash: result.datasetHash.substring(0, 16) + '...',
      contributorAddress: contributorAddress.substring(0, 8) + '...',
    })

    // Optionally register on-chain immediately
    // For now, we return the result and let the frontend call the register endpoint
    // In production, you might want to register automatically here
    
    // Retornar objeto final listo para Soroban
    res.json(result)
  } catch (error: any) {
    // DuplicateStudyError será manejado por el error handler middleware
    if (error instanceof DuplicateStudyError) {
      return next(error)
    }

    // Manejar errores específicos de CVM
    if (error.code === 'TIMEOUT' || error.code === 'QUOTA' || error.code === 'NETWORK_ERROR') {
      logger.error('CVM error in pipeline', {
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
    logger.error('Error in study processing pipeline', {
      error: error.message,
      stack: error.stack,
      code: error.code,
    })

    next(error)
  }
})

export default router

