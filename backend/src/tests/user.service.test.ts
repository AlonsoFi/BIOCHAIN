/**
 * Tests básicos para User Service
 * 
 * Para ejecutar: npm test (cuando se configure Jest/Vitest)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { saveHistoriaClinica, getHistoriaClinica, hasConsent } from '../services/user.service.js'

describe('User Service', () => {
  const testWalletAddress = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

  beforeEach(() => {
    // Limpiar datos antes de cada test
    // En producción, esto se haría con una DB de test
  })

  describe('saveHistoriaClinica', () => {
    it('should save clinical history successfully', () => {
      const historia = {
        añoNacimiento: 1990,
        sexo: 'femenino' as const,
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

      const result = saveHistoriaClinica(testWalletAddress, historia)
      expect(result.success).toBe(true)
    })

    it('should anonymize personal data', () => {
      const historia = {
        añoNacimiento: 1990,
        sexo: 'femenino' as const,
        país: 'Argentina',
        ciudad: 'Buenos Aires',
        usaAnticonceptivos: false,
        condicionesMedicas: [],
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      saveHistoriaClinica(testWalletAddress, historia)
      const saved = getHistoriaClinica(testWalletAddress)

      // Verificar que datos identificables no se guardan
      expect(saved?.historiaClinica).not.toHaveProperty('ciudad')
      expect(saved?.historiaClinica).not.toHaveProperty('país')
    })
  })

  describe('hasConsent', () => {
    it('should return false if no consent exists', () => {
      expect(hasConsent('G_NONEXISTENT_WALLET')).toBe(false)
    })

    it('should return true if consent exists', () => {
      const historia = {
        añoNacimiento: 1990,
        sexo: 'femenino' as const,
        país: 'Argentina',
        ciudad: 'Buenos Aires',
        usaAnticonceptivos: false,
        condicionesMedicas: [],
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      saveHistoriaClinica(testWalletAddress, historia)
      expect(hasConsent(testWalletAddress)).toBe(true)
    })
  })
})

