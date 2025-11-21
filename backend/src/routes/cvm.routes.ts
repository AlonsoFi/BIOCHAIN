import express from 'express'
import multer from 'multer'
import { processPDF, getCVMConfig } from '../services/cvm.service.js'
import { generateProof } from '../services/zkprover.service.js'
import { hashExists, registerHash } from '../services/deduplication.service.js'
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
router.post('/process', upload.single('file'), async (req, res) => {
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

    // 2. Verificar duplicado (ANTI-DUPLICADO - Paso B)
    if (hashExists(cvmResult.datasetHash)) {
      logger.warn('Duplicate study detected', {
        datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
        filename: req.file.originalname,
      })
      
      // Destruir buffer
      pdfBuffer.fill(0)
      
      return res.status(409).json({
        error: 'Duplicate study',
        message: 'Este estudio ya fue procesado anteriormente',
        datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
      })
    }

    // 3. Generar ZK proof
    const zkProof = await generateProof(cvmResult.datasetHash, cvmResult.attestationProof)

    logger.info('ZK proof generated', {
      proofLength: zkProof.proof.length,
    })

    // 4. Registrar hash (después de verificar que no es duplicado)
    registerHash(cvmResult.datasetHash)

    // 5. Destruir buffer original (sobreescribir con ceros)
    pdfBuffer.fill(0)
    pdfBuffer = null

    res.json({
      ...cvmResult,
      zkProof: zkProof.proof,
      publicInputs: zkProof.publicInputs,
      duplicateCheck: 'passed',
    })
  } catch (error: any) {
    // Destruir buffer en caso de error
    if (pdfBuffer) {
      pdfBuffer.fill(0)
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

    logger.error('Error processing file', {
      error: error.message,
      stack: error.stack,
      code: error.code,
    })

    res.status(500).json({
      error: 'Error processing file',
      message: error.message || 'Error interno del servidor',
    })
  }
})

export default router

