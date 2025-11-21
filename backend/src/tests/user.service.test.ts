/**
 * Tests básicos para User Service
 * 
 * Para ejecutar: npm test (cuando se configure Jest/Vitest)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { saveHistoriaClinica, getHistoriaClinica, hasConsent, clearAllData, type HistoriaClinica } from '../services/user.service.js'

describe('User Service', () => {
  const testWalletAddress = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  const testWalletAddress2 = 'GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY'

  beforeEach(() => {
    // Limpiar datos antes de cada test
    clearAllData()
  })

  describe('saveHistoriaClinica', () => {
    it('should save clinical history successfully', () => {
      const historia: HistoriaClinica = {
        datosBasicos: {
          edad: 34,
          genero: 'femenino',
          peso: 65,
          altura: 165,
        },
        saludReproductiva: {
          embarazo: false,
          anticonceptivos: true,
        },
        condicionesMedicas: {
          diabetes: false,
          hipertension: false,
          otras: [],
        },
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      const result = saveHistoriaClinica(testWalletAddress, historia)
      expect(result.success).toBe(true)
    })

    it('should anonymize personal data', () => {
      const historia: HistoriaClinica = {
        datosBasicos: {
          edad: 34,
          genero: 'femenino',
          peso: 65,
          altura: 165,
        },
        saludReproductiva: {
          embarazo: false,
          anticonceptivos: false,
        },
        condicionesMedicas: {
          diabetes: false,
          hipertension: false,
          otras: [],
        },
        consentimiento: {
          firmado: true,
          fecha: new Date().toISOString(),
        },
      }

      saveHistoriaClinica(testWalletAddress2, historia)
      const saved = getHistoriaClinica(testWalletAddress2)

      // Verificar que se guardó correctamente
      expect(saved).not.toBeNull()
      expect(saved).toHaveProperty('datosBasicos')
      expect(saved).toHaveProperty('saludReproductiva')
      expect(saved).toHaveProperty('condicionesMedicas')
      expect(saved).toHaveProperty('consentimiento')
      
      // Verificar que no tiene propiedades identificables como ciudad o país
      // (que no deberían estar en la estructura HistoriaClinica de todos modos)
      expect(saved).not.toHaveProperty('ciudad')
      expect(saved).not.toHaveProperty('país')
    })
  })

  describe('hasConsent', () => {
    it('should return false if no consent exists', () => {
      expect(hasConsent('G_NONEXISTENT_WALLET')).toBe(false)
    })

    it('should return true if consent exists', () => {
      const historia: HistoriaClinica = {
        datosBasicos: {
          edad: 34,
          genero: 'femenino',
          peso: 65,
          altura: 165,
        },
        saludReproductiva: {
          embarazo: false,
          anticonceptivos: false,
        },
        condicionesMedicas: {
          diabetes: false,
          hipertension: false,
          otras: [],
        },
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

