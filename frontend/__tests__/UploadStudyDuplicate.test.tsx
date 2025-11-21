/**
 * Tests para detección de PDFs duplicados en UploadStudy
 * 
 * Para ejecutar estos tests, necesitas configurar Vitest:
 * npm install -D vitest @testing-library/react @testing-library/jest-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadStudy from '../src/pages/user/upload'
import * as cvmApi from '../src/lib/api/cvmApi'

// Mock de las dependencias
vi.mock('../src/lib/api/cvmApi')
vi.mock('../src/lib/stellar/sorobanClient')
vi.mock('../src/lib/api/studiesApi')
vi.mock('../src/lib/encryption/clientEncryption')
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

describe('UploadStudy - Duplicate PDF Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error message when duplicate PDF is detected', async () => {
    const user = userEvent.setup()
    
    // Mock del error de duplicado
    const duplicateError = {
      response: {
        data: {
          code: 'DUPLICATE_PDF',
          message: 'Este estudio ya fue procesado anteriormente',
          datasetHash: 'abc123...',
        },
        status: 409,
      },
    }

    // Mock processStudyFile para lanzar error de duplicado
    vi.mocked(cvmApi.processStudyFile).mockRejectedValue(duplicateError)

    render(<UploadStudy />)

    // Simular selección de archivo
    const fileInput = screen.getByLabelText(/seleccionar archivo/i) || 
                     document.getElementById('file-input')
    
    if (fileInput) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file)
    }

    // Simular click en botón de upload
    const uploadButton = screen.getByText(/procesar y agregar/i)
    await user.click(uploadButton)

    // Verificar que el mensaje de error aparece
    await waitFor(() => {
      expect(screen.getByText(/este estudio ya fue cargado anteriormente/i)).toBeInTheDocument()
    })

    // Verificar que el botón "Subir otro PDF" aparece
    expect(screen.getByText(/subir otro pdf/i)).toBeInTheDocument()
  })

  it('should allow user to reset and upload different file after duplicate error', async () => {
    const user = userEvent.setup()
    
    const duplicateError = {
      response: {
        data: {
          code: 'DUPLICATE_PDF',
          message: 'Este estudio ya fue procesado anteriormente',
        },
        status: 409,
      },
    }

    vi.mocked(cvmApi.processStudyFile).mockRejectedValueOnce(duplicateError)

    render(<UploadStudy />)

    // Simular upload que falla por duplicado
    const fileInput = document.getElementById('file-input')
    if (fileInput) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file)
    }

    const uploadButton = screen.getByText(/procesar y agregar/i)
    await user.click(uploadButton)

    // Esperar a que aparezca el error
    await waitFor(() => {
      expect(screen.getByText(/este estudio ya fue cargado anteriormente/i)).toBeInTheDocument()
    })

    // Click en "Subir otro PDF"
    const resetButton = screen.getByText(/subir otro pdf/i)
    await user.click(resetButton)

    // Verificar que el error desapareció
    await waitFor(() => {
      expect(screen.queryByText(/este estudio ya fue cargado anteriormente/i)).not.toBeInTheDocument()
    })
  })

  it('should disable upload button when duplicate error is shown', async () => {
    const user = userEvent.setup()
    
    const duplicateError = {
      response: {
        data: {
          code: 'DUPLICATE_PDF',
          message: 'Este estudio ya fue procesado anteriormente',
        },
        status: 409,
      },
    }

    vi.mocked(cvmApi.processStudyFile).mockRejectedValue(duplicateError)

    render(<UploadStudy />)

    const fileInput = document.getElementById('file-input')
    if (fileInput) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file)
    }

    const uploadButton = screen.getByText(/procesar y agregar/i)
    await user.click(uploadButton)

    await waitFor(() => {
      const disabledButton = screen.getByText(/procesar y agregar/i).closest('button')
      expect(disabledButton).toBeDisabled()
    })
  })

  it('should clear duplicate error when new file is selected', async () => {
    const user = userEvent.setup()
    
    const duplicateError = {
      response: {
        data: {
          code: 'DUPLICATE_PDF',
          message: 'Este estudio ya fue procesado anteriormente',
        },
        status: 409,
      },
    }

    vi.mocked(cvmApi.processStudyFile).mockRejectedValueOnce(duplicateError)

    render(<UploadStudy />)

    // Simular upload que falla
    const fileInput = document.getElementById('file-input')
    if (fileInput) {
      const file1 = new File(['test content 1'], 'test1.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file1)
    }

    const uploadButton = screen.getByText(/procesar y agregar/i)
    await user.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText(/este estudio ya fue cargado anteriormente/i)).toBeInTheDocument()
    })

    // Seleccionar nuevo archivo
    if (fileInput) {
      const file2 = new File(['test content 2'], 'test2.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file2)
    }

    // Verificar que el error desapareció
    await waitFor(() => {
      expect(screen.queryByText(/este estudio ya fue cargado anteriormente/i)).not.toBeInTheDocument()
    })
  })
})

