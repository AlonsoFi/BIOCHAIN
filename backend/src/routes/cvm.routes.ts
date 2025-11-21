import express from 'express'
import multer from 'multer'
import { processStudyFile } from '../services/cvm-gateway.service.js'
import { generateProof } from '../services/zkprover.service.js'
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
 * Procesa archivo en CVM (NVIDIA TEE)
 * 
 * Flujo:
 * 1. Recibe PDF
 * 2. Lo procesa en CVM (mock)
 * 3. Genera ZK proof
 * 4. Devuelve hash, metadata, attestation, zk_proof
 * 
 * IMPORTANTE: El archivo NO se guarda, solo se procesa
 */
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      logger.warn('File upload attempt without file')
      return res.status(400).json({ error: 'No file provided' })
    }

    logger.info('Processing file in CVM', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })

    // 1. Procesar en CVM (mock)
    const cvmResult = await processStudyFile(req.file.buffer)

    logger.info('CVM processing completed', {
      datasetHash: cvmResult.datasetHash.substring(0, 16) + '...',
    })

    // 2. Generar ZK proof
    const zkProof = await generateProof(cvmResult.datasetHash, cvmResult.attestationProof)

    logger.info('ZK proof generated', {
      proofLength: zkProof.proof.length,
    })

    // 3. El archivo se descarta aquí (req.file.buffer se pierde)
    // En producción, el CVM ya habría destruido el archivo

    res.json({
      ...cvmResult,
      zkProof: zkProof.proof,
      publicInputs: zkProof.publicInputs,
    })
  } catch (error: any) {
    logger.error('Error processing file', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'Error processing file' })
  }
})

export default router

