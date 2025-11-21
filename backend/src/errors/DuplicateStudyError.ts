/**
 * Custom Error for Duplicate Study Detection
 * 
 * Thrown when a study with the same dataset_hash has already been uploaded
 */

export class DuplicateStudyError extends Error {
  code = 'DUPLICATE_PDF'
  status = 409
  datasetHash?: string

  constructor(message: string = 'This study has already been uploaded. Please upload a different PDF.', datasetHash?: string) {
    super(message)
    this.name = 'DuplicateStudyError'
    this.datasetHash = datasetHash

    // Mantener el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateStudyError)
    }
  }
}

