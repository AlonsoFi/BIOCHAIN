import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDataset } from '@/lib/api/datasetsApi'
import type { Dataset } from '@/lib/api/datasetsApi'
import { purchaseDataset } from '@/lib/blockchain/datasets'
import Badge from '@/components/ui/Badge'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function DatasetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      loadDataset()
    }
  }, [id])

  const loadDataset = async () => {
    try {
      const data = await getDataset(id!)
      setDataset(data)
    } catch (error) {
      console.error('Error cargando dataset:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!id || !dataset) return

    setPurchasing(true)
    setPurchaseSuccess(false)

    try {
      console.log('🟣 Starting dataset purchase...', { datasetId: id })

      // Call blockchain purchase function
      const result = await purchaseDataset(id)

      console.log('📄 FULL DATASET PURCHASE EVENT LOG:', result)

      // Log all events for developer debugging
      if (result.events && result.events.length > 0) {
        console.log('📣 All Events:', result.events)
        result.events.forEach((evt, idx) => {
          console.log(`📣 EVENT [${idx}]:`, evt)
        })
      }

      // User-friendly success message
      setPurchaseSuccess(true)
      
      // Show success message (simple, no blockchain jargon)
      setTimeout(() => {
        alert('✅ ¡Dataset comprado exitosamente!\n\nYa puedes acceder a todos los datos del dataset.')
        navigate('/researcher/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('❌ Purchase error:', error)
      
      // User-friendly error message (simple)
      alert('Error al procesar la compra. Por favor, intenta de nuevo.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7B6BA8]"></div>
      </div>
    )
  }

  if (!dataset) {
    return <div>Dataset no encontrado</div>
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <button onClick={() => navigate('/researcher/marketplace')} className="text-gray-600 hover:text-[#7B6BA8]">
            Buscar datasets
          </button>
          <span>›</span>
          <span className="font-semibold text-gray-900">{dataset.id}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm text-gray-600 font-semibold mb-2">ID: {dataset.id}</div>
                  <h1 className="text-3xl font-black text-gray-900 mb-4">{dataset.name}</h1>
                  <div className="flex gap-2">
                    <Badge variant="success">✓ Verificado médicamente</Badge>
                    <Badge variant="premium">⭐ Dataset Premium</Badge>
                  </div>
                </div>
              </div>

              {/* Perfil Demográfico */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">👤 Perfil demográfico</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Rango de edad', value: dataset.metadata.ageRange },
                    { label: 'Sexo biológico', value: 'Femenino' },
                    { label: 'Ubicación', value: dataset.metadata.population },
                    { label: 'Etnia', value: 'Hispana/Latina' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAFA] rounded-xl">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-gray-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salud Reproductiva */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">💊 Salud reproductiva</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Método anticonceptivo', value: 'Píldora combinada' },
                    { label: 'Marca', value: 'Yasmin' },
                    { label: 'Tiempo de uso', value: '3 años, 2 meses' },
                    { label: 'Métodos previos', value: 'Ninguno' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAFA] rounded-xl">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-gray-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condiciones Médicas */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🏥 Condiciones médicas</h3>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Badge>SOP</Badge>
                  <Badge>Resistencia a la insulina</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Medicación actual</h4>
                  <div className="flex gap-2">
                    <Badge>Metformina 850mg</Badge>
                  </div>
                </div>
              </div>

              {/* Análisis de Sangre */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🔬 Análisis de sangre incluidos</h3>
                <p className="text-sm text-gray-600 mb-4">Este dataset incluye 3 análisis realizados en enero 2025</p>
                
                <div className="bg-[#FAFAFA] rounded-xl p-6 mb-4">
                  <h4 className="text-sm font-bold mb-4">Perfil hormonal</h4>
                  {['Estradiol', 'Progesterona', 'Testosterona', 'FSH', 'LH'].map((test) => (
                    <div key={test} className="flex justify-between items-center py-3 border-b border-white last:border-0">
                      <span className="text-sm text-gray-900">{test}</span>
                      <span className="text-sm font-semibold text-gray-400 bg-gray-400 rounded px-2">██.█</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#7B6BA8]/10 border-l-4 border-[#7B6BA8] p-4 rounded-r-xl text-center">
                  <p className="text-sm text-[#7B6BA8]">
                    🔒 Los valores exactos se revelan al comprar acceso al dataset
                  </p>
                </div>
              </div>

              {/* Síntomas */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📋 Síntomas reportados</h3>
                <div className="space-y-3">
                  {[
                    { nombre: 'Cambios de humor', severidad: 70 },
                    { nombre: 'Cefaleas', severidad: 50 },
                    { nombre: 'Fatiga', severidad: 40 },
                    { nombre: 'Aumento de peso', severidad: 30 },
                  ].map((sintoma, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-xl">
                      <span className="text-sm font-semibold text-gray-900">{sintoma.nombre}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FF6B35] rounded-full"
                            style={{ width: `${sintoma.severidad}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{sintoma.severidad / 10}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-lg sticky top-8">
              <div className="text-center pb-6 border-b border-gray-100 mb-6">
                <div className="text-sm text-gray-600 mb-2">Precio del dataset</div>
                <div className="text-5xl font-black text-[#FF6B35] mb-2">${dataset.price}</div>
                <div className="text-xs text-gray-500">El 85% (${Math.round(dataset.price * 0.85)}) va directo al contribuyente</div>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  'Acceso por 90 días',
                  'Descarga en JSON y CSV',
                  'Todos los valores de análisis',
                  'Consentimiento ético verificable',
                  'Soporte técnico incluido',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-gray-900">
                    <span className="text-[#10B981]">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing || purchaseSuccess}
                className={`w-full px-6 py-4 rounded-xl font-bold transition shadow-lg mb-4 flex items-center justify-center gap-2 ${
                  purchaseSuccess
                    ? 'bg-[#10B981] text-white cursor-not-allowed'
                    : purchasing
                    ? 'bg-[#FF6B35]/70 text-white cursor-wait'
                    : 'bg-[#FF6B35] text-white hover:bg-[#FF8C61]'
                }`}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : purchaseSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>¡Comprado exitosamente!</span>
                  </>
                ) : (
                  <span>Comprar acceso →</span>
                )}
              </button>

              <button
                onClick={() => {
                  // TODO: Implementar guardado en favoritos
                  alert('Función de favoritos en desarrollo. Próximamente podrás guardar datasets para después.')
                }}
                className="w-full px-6 py-3 bg-[#FAFAFA] text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition border-2 border-gray-200"
              >
                ❤️ Guardar para después
              </button>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>🔒</span>
                  <span>Datos encriptados con AES-256</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>⛓️</span>
                  <span>Trazabilidad en blockchain Stellar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>✅</span>
                  <span>Consentimiento firmado y auditable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

