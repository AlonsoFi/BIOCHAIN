/**
 * Tests para validación con Zod
 */

import { describe, it, expect } from 'vitest'
import {
  HistoriaClinicaSchema,
  WalletAddressSchema,
  DatasetIdSchema,
} from '../utils/validation.js'

describe('Validation Schemas', () => {
  describe('HistoriaClinicaSchema', () => {
    it('should validate correct clinical history', () => {
      const validHistory = {
        añoNacimiento: 1990,
        sexo: 'femenino',
        país: 'Argentina',
        ciudad: 'Buenos Aires',
        usaAnticonceptivos: true,
        tipoAnticonceptivo: 'Píldora',
        condicionesMedicas: [],
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      const result = HistoriaClinicaSchema.safeParse(validHistory)
      expect(result.success).toBe(true)
    })

    it('should reject invalid añoNacimiento', () => {
      const invalidHistory = {
        añoNacimiento: 1800, // Muy antiguo
        sexo: 'femenino',
        país: 'Argentina',
        ciudad: 'Buenos Aires',
        usaAnticonceptivos: false,
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      const result = HistoriaClinicaSchema.safeParse(invalidHistory)
      expect(result.success).toBe(false)
    })

    it('should reject invalid sexo', () => {
      const invalidHistory = {
        añoNacimiento: 1990,
        sexo: 'invalid', // No válido
        país: 'Argentina',
        ciudad: 'Buenos Aires',
        usaAnticonceptivos: false,
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      const result = HistoriaClinicaSchema.safeParse(invalidHistory)
      expect(result.success).toBe(false)
    })
  })

  describe('WalletAddressSchema', () => {
    it('should validate correct Stellar wallet address', () => {
      const validAddress = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      const result = WalletAddressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it('should reject invalid wallet address format', () => {
      const invalidAddress = 'invalid_address'
      const result = WalletAddressSchema.safeParse(invalidAddress)
      expect(result.success).toBe(false)
    })

    it('should reject wallet address that is too short', () => {
      const invalidAddress = 'GXXXX'
      const result = WalletAddressSchema.safeParse(invalidAddress)
      expect(result.success).toBe(false)
    })
  })

  describe('DatasetIdSchema', () => {
    it('should validate correct UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      const result = DatasetIdSchema.safeParse(validUUID)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalidUUID = 'not-a-uuid'
      const result = DatasetIdSchema.safeParse(invalidUUID)
      expect(result.success).toBe(false)
    })
  })
})

