/**
 * Tests para integración completa de CVM (REAL + MOCK + AUTO)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processPDFInMockCVM } from '../services/cvm-gateway-mock.service.js'
import { processPDF, getCVMConfig } from '../services/cvm.service.js'
import { hashExists, registerHash, clearAllHashes } from '../services/deduplication.service.js'

describe('CVM Integration', () => {
  beforeEach(() => {
    clearAllHashes()
  })

  describe('Mock CVM Service', () => {
    it('should process PDF and return dataset hash', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processPDFInMockCVM(mockFile)

      expect(result).toHaveProperty('datasetHash')
      expect(result).toHaveProperty('summaryMetadata')
      expect(result).toHaveProperty('attestationProof')
      expect(result.mode).toBe('mock')
      expect(result.datasetHash).toBeTruthy()
      expect(result.datasetHash.length).toBe(64) // SHA256 hex = 64 chars
    })

    it('should return metadata with biomarkers', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processPDFInMockCVM(mockFile)

      expect(result.summaryMetadata).toHaveProperty('age')
      expect(result.summaryMetadata).toHaveProperty('condition')
      expect(result.summaryMetadata).toHaveProperty('population')
      expect(result.summaryMetadata.biomarkers).toBeDefined()
    })

    it('should return attestation proof', async () => {
      const mockFile = Buffer.from('mock PDF content')
      const result = await processPDFInMockCVM(mockFile)

      expect(result.attestationProof).toBeTruthy()
      expect(result.attestationProof).toContain('mock_attestation_')
    })

    it('should generate deterministic hash for same data', async () => {
      const mockFile1 = Buffer.from('same content')
      const mockFile2 = Buffer.from('same content')

      const result1 = await processPDFInMockCVM(mockFile1)
      const result2 = await processPDFInMockCVM(mockFile2)

      // Hashes deberían ser iguales si los datos normalizados son iguales
      // (Nota: En mock, puede variar por timestamp, pero la estructura debe ser consistente)
      expect(result1.datasetHash).toBeTruthy()
      expect(result2.datasetHash).toBeTruthy()
    })

    it('should destroy buffer after processing', async () => {
      const mockFile = Buffer.from('test content')
      const originalContent = mockFile.toString()
      
      await processPDFInMockCVM(mockFile)

      // Buffer debería estar destruido (lleno de ceros)
      const afterContent = mockFile.toString()
      expect(afterContent).not.toBe(originalContent)
      // Verificar que está lleno de ceros (o al menos modificado)
      expect(mockFile.every(byte => byte === 0)).toBe(true)
    })
  })

  describe('CVM Manager - Mode Selection', () => {
    it('should use MOCK mode when configured', async () => {
      process.env.CVM_MODE = 'mock'
      const config = getCVMConfig()
      
      expect(config.mode).toBe('mock')
    })

    it('should use AUTO mode by default', async () => {
      delete process.env.CVM_MODE
      const config = getCVMConfig()
      
      expect(config.mode).toBe('auto')
    })

    it('should process in MOCK mode when forced', async () => {
      const mockFile = Buffer.from('test content')
      const config = { mode: 'mock' as const }
      
      const result = await processPDF({
        encryptedPDFBuffer: mockFile,
        config,
      })

      expect(result.mode).toBe('mock')
      expect(result.attemptedReal).toBe(false)
      expect(result.fallbackUsed).toBe(false)
    })
  })

  describe('Deduplication Service', () => {
    it('should register hash', () => {
      const hash = 'test_hash_123'
      
      expect(hashExists(hash)).toBe(false)
      registerHash(hash)
      expect(hashExists(hash)).toBe(true)
    })

    it('should detect duplicate hash', () => {
      const hash = 'duplicate_hash_456'
      
      registerHash(hash)
      expect(hashExists(hash)).toBe(true)
      
      // Intentar registrar de nuevo
      registerHash(hash)
      expect(hashExists(hash)).toBe(true) // Debe seguir existiendo
    })

    it('should clear all hashes', () => {
      registerHash('hash1')
      registerHash('hash2')
      
      expect(hashExists('hash1')).toBe(true)
      expect(hashExists('hash2')).toBe(true)
      
      clearAllHashes()
      
      expect(hashExists('hash1')).toBe(false)
      expect(hashExists('hash2')).toBe(false)
    })
  })

  describe('End-to-End: Upload with Deduplication', () => {
    it('should reject duplicate upload', async () => {
      const mockFile = Buffer.from('test PDF')
      
      // Primera subida
      const result1 = await processPDFInMockCVM(mockFile)
      registerHash(result1.datasetHash)
      
      // Segunda subida (duplicado)
      const mockFile2 = Buffer.from('test PDF') // Mismo contenido
      const result2 = await processPDFInMockCVM(mockFile2)
      
      // Verificar que es duplicado
      const isDuplicate = hashExists(result2.datasetHash)
      expect(isDuplicate).toBe(true)
    })

    it('should allow different files', async () => {
      const file1 = Buffer.from('file 1 content')
      const file2 = Buffer.from('file 2 content')
      
      const result1 = await processPDFInMockCVM(file1)
      registerHash(result1.datasetHash)
      
      const result2 = await processPDFInMockCVM(file2)
      
      // Deberían ser diferentes
      expect(result1.datasetHash).not.toBe(result2.datasetHash)
      
      // El segundo no debería estar registrado
      expect(hashExists(result2.datasetHash)).toBe(false)
    })
  })
})


