import { useEffect, useState } from 'react'
import { getStudies, type Study } from '@/lib/api/studiesApi'

export default function StudiesList() {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudies()
  }, [])

  const loadStudies = async () => {
    try {
      const data = await getStudies()
      setStudies(data)
    } catch (error) {
      console.error('Error cargando estudios:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  if (studies.length === 0) {
    return <p className="text-gray-500">No hay estudios aún</p>
  }

  return (
    <div className="space-y-4">
      {studies.map((study) => (
        <div
          key={study.id}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#9B8BC5] rounded-xl flex items-center justify-center text-2xl">🔬</div>
            <div>
              <h4 className="text-base font-bold text-gray-900">{study.name}</h4>
              <p className="text-sm text-gray-600">
                {new Date(study.date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} • {study.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="px-4 py-2 bg-[#FAFAFA] rounded-full text-sm text-gray-600">🛒 {study.sales} ventas</span>
            <div className="text-right">
              <div className="text-xl font-bold text-[#FF6B35]">${study.earnings}</div>
              <div className="text-xs text-gray-500">ganado</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

