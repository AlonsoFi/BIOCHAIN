import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { processStudyFile } from '@/lib/api/cvmApi'
import { registerStudy } from '@/lib/stellar/sorobanClient'
import { encryptFile } from '@/lib/encryption/clientEncryption'
import { Upload, FileText, CheckCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  status: 'pending' | 'processing' | 'processed' | 'error'
  result?: any
}

export default function UploadStudy() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'upload' | 'processing' | 'cvm' | 'zk' | 'blockchain' | 'done'>('upload')
  const [result, setResult] = useState<any>(null)
  const [dragging, setDragging] = useState(false)
  const navigate = useNavigate()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setStep('processing')

    try {
      // Step 0: Client-side encryption (según diagrama)
      // "User uploads PDF" → "Client-side encryption" → "Send encrypted file to NVIDIA CVM"
      const encryptedFile = await encryptFile(file)
      
      // Step 1: Procesar en CVM (NVIDIA TEE) + Generar ZK Proof
      // El backend hace TODO: CVM → hash → ZK proof
      setStep('cvm')
      // Convertir Blob encriptado a File para enviar
      const encryptedFileObj = new File([encryptedFile], file.name, { type: file.type })
      const cvmResult = await processStudyFile(encryptedFileObj)
      console.log('CVM Result:', cvmResult)
      // cvmResult ya incluye: datasetHash, summaryMetadata, attestationProof, zkProof, publicInputs

      // Step 2: ZK Proof ya generado por el backend
      setStep('zk')
      // El backend ya generó el ZK proof usando:
      // - datasetHash (del CVM)
      // - attestationProof (del CVM)
      // → zkProof (zero-knowledge proof que valida sin revelar contenido)

      // Step 3: Registrar en blockchain (Soroban)
      setStep('blockchain')
      const cycleTimestamp = Math.floor(Date.now() / 1000)
      const txHash = await registerStudy(
        cvmResult.zkProof, // Usar el ZK proof del backend
        cvmResult.attestationProof,
        cvmResult.datasetHash,
        cycleTimestamp
      )

      const newResult = {
        datasetHash: cvmResult.datasetHash,
        txHash,
        metadata: cvmResult.summaryMetadata,
        zkProof: cvmResult.zkProof,
        publicInputs: cvmResult.publicInputs,
      }
      setResult(newResult)

      // Agregar a lista de archivos procesados
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          file: file!,
          status: 'processed',
          result: newResult,
        },
      ])

      setStep('done')
    } catch (error) {
      console.error('Error subiendo estudio:', error)
      alert('Error al procesar el archivo. Intenta de nuevo.')
      setStep('upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Subir Estudio Médico</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Upload Step */}
          {step === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition ${
                  dragging
                    ? 'border-[#7B6BA8] bg-[#7B6BA8]/10'
                    : 'border-[#9B8BC5] bg-[#FAFAFA] hover:border-[#7B6BA8]'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Arrastrá tus archivos aquí</h3>
                <p className="text-gray-600 mb-4">o</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block px-8 py-3 bg-[#7B6BA8] text-white rounded-xl cursor-pointer hover:bg-[#5D4A7E] font-bold shadow-lg"
                >
                  Seleccionar Archivo
                </label>
                <p className="text-sm text-gray-500 mt-4">(PDF, JPG, PNG)</p>
                {file && (
                  <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-white rounded-xl">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Archivos subidos</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((uploadedFile) => (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl">
                            📄
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{uploadedFile.file.name}</h4>
                            <p className="text-xs text-gray-600">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB • Subido hace 2 días
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-semibold ${
                              uploadedFile.status === 'processed'
                                ? 'bg-[#10B981]/10 text-[#10B981]'
                                : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                            }`}
                          >
                            {uploadedFile.status === 'processed' ? 'Procesado ✓' : 'Procesando...'}
                          </span>
                          <button className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center text-xl">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {file && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={handleUpload}
                    className="w-full px-6 py-4 bg-[#FF6B35] text-white rounded-xl hover:bg-[#FF8C61] transition font-bold shadow-lg"
                  >
                    Procesar y agregar a mi dataset
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Steps */}
          {step !== 'upload' && step !== 'done' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-stellar-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">
                {step === 'processing' && 'Iniciando procesamiento...'}
                {step === 'cvm' && 'Procesando en NVIDIA CVM (TEE): Extrayendo biomarkers, detectando laboratorio, eliminando PII...'}
                {step === 'zk' && 'Generando Zero-Knowledge Proof...'}
                {step === 'blockchain' && 'Registrando en blockchain (Soroban): Validando ZK proof, Attestation, No duplicates...'}
              </p>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && result && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">¡Estudio Registrado Exitosamente!</h2>
              <div className="bg-gray-50 rounded-lg p-6 text-left space-y-2">
                <div>
                  <span className="font-medium">Dataset Hash:</span>
                  <p className="font-mono text-sm">{result.datasetHash}</p>
                </div>
                <div>
                  <span className="font-medium">Transaction Hash:</span>
                  <p className="font-mono text-sm">{result.txHash}</p>
                </div>
                <div>
                  <span className="font-medium">Metadata:</span>
                  <pre className="text-sm mt-1">{JSON.stringify(result.metadata, null, 2)}</pre>
                </div>
                <div>
                  <span className="font-medium">ZK Proof:</span>
                  <p className="font-mono text-xs break-all mt-1 text-gray-600">
                    {result.zkProof}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Zero-Knowledge: Valida el estudio sin revelar contenido
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/user/dashboard')}
                className="mt-6 px-6 py-2 bg-stellar-primary text-white rounded-lg hover:bg-purple-700"
              >
                Volver al Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

