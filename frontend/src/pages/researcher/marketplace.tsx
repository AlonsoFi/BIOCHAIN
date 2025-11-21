import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDatasets, purchaseDataset } from '@/lib/api/datasetsApi'
import type { Dataset } from '@/lib/api/datasetsApi'
import { ShoppingCart, DollarSign } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function Marketplace() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadDatasets()
  }, [])

  const loadDatasets = async () => {
    try {
      const data = await getDatasets()
      setDatasets(data)
    } catch (error) {
      console.error('Error cargando datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (datasetId: string) => {
    setPurchasing(datasetId)
    try {
      const { txHash } = await purchaseDataset(datasetId)
      alert(`¡Dataset comprado exitosamente! TX: ${txHash}`)
      navigate(`/researcher/dataset/${datasetId}`)
    } catch (error) {
      console.error('Error comprando dataset:', error)
      alert('Error al comprar el dataset. Intenta de nuevo.')
    } finally {
      setPurchasing(null)
    }
  }

  const suggestions = [
    '🔬 Efectos de anticonceptivos en salud mental',
    '💊 Análisis de SOP (Síndrome de Ovario Poliquístico)',
    '🩸 Niveles hormonales en edad fértil',
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7B6BA8]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm">
          <h1 className="text-4xl font-black text-[#5D4A7E] mb-2">Buscar datasets</h1>
          <p className="text-lg text-gray-600">Encuentra datasets verificados para tu investigación</p>
        </div>

        {/* AI Chat Section */}
        <div className="bg-white rounded-3xl p-10 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7B6BA8] to-[#FF6B35] rounded-full flex items-center justify-center text-3xl">
              🤖
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Asistente de investigación IA</h2>
              <p className="text-gray-600">Describe tu investigación y te ayudo a encontrar los mejores datasets</p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Necesito datos de mujeres 25-35 años usando anticonceptivos hormonales..."
              className="w-full px-6 py-5 pr-20 border-2 border-[#FAFAFA] rounded-2xl text-lg bg-[#FAFAFA] focus:outline-none focus:border-[#7B6BA8] focus:bg-white focus:shadow-lg transition"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#7B6BA8] text-white rounded-xl hover:bg-[#5D4A7E] transition">
              🔍
            </button>
          </div>

          <div className="flex gap-4 mt-6 flex-wrap">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(suggestion.substring(2))}
                className="px-6 py-3 bg-[#FAFAFA] rounded-full text-gray-600 text-sm font-medium border-2 border-transparent hover:border-[#7B6BA8] hover:text-[#7B6BA8] transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-gray-900">Datasets disponibles</h2>
          <button className="px-6 py-3 bg-white border-2 border-[#FAFAFA] rounded-xl text-gray-600 font-semibold hover:border-[#7B6BA8] hover:text-[#7B6BA8] transition">
            🔽 Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-[#7B6BA8]"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-gray-600">ID: {dataset.id}</span>
                <Badge variant="success">✓ Verificado</Badge>
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-4">{dataset.name}</h3>

              <div className="flex gap-2 mb-4 flex-wrap">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Análisis</div>
                  <div className="text-sm font-bold text-gray-900">{dataset.metadata.condition}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha</div>
                  <div className="text-sm font-bold text-gray-900">Enero 2025</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Síntomas</div>
                  <div className="text-sm font-bold text-gray-900">Cambios de humor</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ubicación</div>
                  <div className="text-sm font-bold text-gray-900">{dataset.metadata.population}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#10B981]" />
                  <span className="text-3xl font-black text-[#FF6B35]">${dataset.price}</span>
                </div>
                <button
                  onClick={() => navigate(`/researcher/dataset/${dataset.id}`)}
                  className="px-6 py-3 bg-[#7B6BA8] text-white rounded-xl font-bold hover:bg-[#5D4A7E] transition shadow-lg hover:-translate-y-0.5"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {datasets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datasets disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
