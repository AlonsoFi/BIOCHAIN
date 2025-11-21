import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Database, ShoppingCart, Settings, LogOut, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ResearcherDashboard() {
  const { walletAddress, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const suggestions = [
    '🔬 Efectos de anticonceptivos en salud mental',
    '💊 Análisis de SOP (Síndrome de Ovario Poliquístico)',
    '🩸 Niveles hormonales en edad fértil',
  ]

  const handleSuggestionClick = (suggestion: string) => {
    // Filtrar datasets basado en sugerencia
    navigate('/researcher/marketplace?q=' + encodeURIComponent(suggestion.substring(2)))
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 p-8 flex flex-col fixed left-0 top-0 bottom-0">
        <div className="mb-12">
          <h1 className="text-2xl font-black text-[#7B6BA8]">BioChain</h1>
          <p className="text-sm text-gray-500 mt-1">Investigador</p>
        </div>

        <nav className="flex-1">
          {[
            { id: 'search', label: 'Buscar Datasets', icon: Search, path: '/researcher/marketplace' },
            { id: 'datasets', label: 'Mis Datasets', icon: Database },
            { id: 'payments', label: 'Pagos', icon: ShoppingCart },
            { id: 'settings', label: 'Configuración', icon: Settings },
          ].map(({ id, label, icon: Icon, path }) => (
            <Link
              key={id}
              to={path || '#'}
              className="w-full flex items-center gap-4 px-6 py-3 mb-2 rounded-xl text-gray-700 hover:bg-gray-100 transition font-semibold"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-200">
          <div className="p-4 bg-[#FAFAFA] rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 bg-[#7B6BA8] rounded-full flex items-center justify-center text-xl">👨‍🔬</div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Dr. Rodríguez</h4>
              <p className="text-xs text-gray-500">Investigador</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 mb-2">Wallet</div>
          <div className="text-sm font-mono text-gray-700 truncate mb-4">
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8">
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
              placeholder="Ej: Necesito datos de mujeres 25-35 años usando anticonceptivos hormonales..."
              className="w-full px-6 py-5 pr-20 border-2 border-[#FAFAFA] rounded-2xl text-lg bg-[#FAFAFA] focus:outline-none focus:border-[#7B6BA8] focus:bg-white focus:shadow-lg transition"
            />
            <button
              onClick={() => {
                // Navegar al marketplace con búsqueda
                navigate('/researcher/marketplace')
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#7B6BA8] text-white rounded-xl hover:bg-[#5D4A7E] transition"
            >
              🔍
            </button>
          </div>

          <div className="flex gap-4 mt-6 flex-wrap">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-6 py-3 bg-[#FAFAFA] rounded-full text-gray-600 text-sm font-medium border-2 border-transparent hover:border-[#7B6BA8] hover:text-[#7B6BA8] transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4">Accesos Rápidos</h3>
          <Link
            to="/researcher/marketplace"
            className="block w-full px-6 py-4 bg-[#7B6BA8] text-white rounded-xl hover:bg-[#5D4A7E] transition text-center font-bold shadow-lg"
          >
            Ver Marketplace
          </Link>
        </div>
      </main>
    </div>
  )
}
