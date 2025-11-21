/**
 * Tests para CVM Gateway Service
 */

import { describe, it, expect } from 'vitest'
import { processStudyFile } from '../services/cvm-gateway.service.js'

describe('CVM Gateway Service', () => {
  describe('processStudyFile', () => {
    it('should process file and return dataset hash', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processStudyFile(mockFile)

      expect(result).toHaveProperty('datasetHash')
      expect(result).toHaveProperty('summaryMetadata')
      expect(result).toHaveProperty('attestationProof')
      expect(result.datasetHash).toBeTruthy()
      expect(result.datasetHash.length).toBeGreaterThan(0)
    })

    it('should return metadata with biomarkers', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processStudyFile(mockFile)

      expect(result.summaryMetadata).toHaveProperty('age')
      expect(result.summaryMetadata).toHaveProperty('condition')
      expect(result.summaryMetadata).toHaveProperty('population')
    })

    it('should return attestation proof', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processStudyFile(mockFile)

      expect(result.attestationProof).toBeTruthy()
      expect(result.attestationProof).toContain('mock_attestation_')
    })

    it('should generate different hashes for different files', async () => {
      const file1 = Buffer.from('file 1 content')
      const file2 = Buffer.from('file 2 content')

      const result1 = await processStudyFile(file1)
      const result2 = await processStudyFile(file2)

      expect(result1.datasetHash).not.toBe(result2.datasetHash)
    })
  })
})

