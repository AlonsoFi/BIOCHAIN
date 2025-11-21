/**
 * Global Error Handler Middleware
 * 
 * Maneja errores de forma centralizada y devuelve respuestas consistentes
 */

import { Request, Response, NextFunction } from 'express'
import { DuplicateStudyError } from '../errors/DuplicateStudyError.js'
import logger from '../utils/logger.js'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Manejar DuplicateStudyError específicamente
  if (err instanceof DuplicateStudyError) {
    logger.warn('Duplicate study error', {
      code: err.code,
      message: err.message,
      datasetHash: err.datasetHash?.substring(0, 16) + '...',
      path: req.path,
      method: req.method,
    })

    res.status(err.status).json({
      code: err.code,
      message: err.message,
      datasetHash: err.datasetHash?.substring(0, 16) + '...',
    })
    return
  }

  // Manejar otros errores
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
  })

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  })
}

