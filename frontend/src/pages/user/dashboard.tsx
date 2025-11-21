import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InlineWarning from '@/components/ui/InlineWarning'
import { getHistoriaClinica } from '@/lib/api/userApi'
import { getContributorEvents, type ContributorEventsResponse } from '@/lib/api/contributorApi'
import { useAuthStore } from '@/store/authStore'
import { Upload, FileText, Wallet, User, Settings, LogOut, Home, Loader2 } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import ActionCard from '@/components/ui/ActionCard'

type Tab = 'inicio' | 'subir' | 'estudios' | 'wallet' | 'historia' | 'config'

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const { walletAddress, logout } = useAuthStore()
  const [hasHistory, setHasHistory] = useState<boolean | null>(null)
  const [contributorData, setContributorData] = useState<ContributorEventsResponse | null>(null)
  const [loadingContributorData, setLoadingContributorData] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!walletAddress) {
      setHasHistory(false)
      return
    }

    const fetchHistory = async () => {
      try {
        const history = await getHistoriaClinica()
        setHasHistory(history !== null)
      } catch (err) {
        setHasHistory(false)
      }
    }

    fetchHistory()
  }, [walletAddress])

  // Fetch contributor events when wallet is available
  useEffect(() => {
    if (!walletAddress) return

    const fetchContributorData = async () => {
      setLoadingContributorData(true)
      try {
        const data = await getContributorEvents()
        setContributorData(data)
        
        // Log full technical details for developers
        console.log('📡 Contributor Dashboard Data:', data)
        console.log('📊 Studies:', data.studies)
        console.log('💰 Payouts:', data.payouts)
        console.log('📈 Dataset Usage:', data.datasetUsage)
        console.log('💵 Total Earned:', data.totalEarnedUSDC, 'USDC')
      } catch (error) {
        console.error('Error fetching contributor data:', error)
      } finally {
        setLoadingContributorData(false)
      }
    }

    fetchContributorData()
  }, [walletAddress])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Calculate stats from contributor data
  const stats = {
    estudiosSubidos: contributorData?.studies.length || 0,
    datasetsVendidos: Object.values(contributorData?.datasetUsage || {}).reduce((sum, count) => sum + count, 0),
    totalGanado: Math.round(contributorData?.totalEarnedUSDC || 0),
    balanceDisponible: Math.round(contributorData?.totalEarnedUSDC || 0), // TODO: Get real wallet balance
  }

  // Generate activities from contributor data
  const actividades = contributorData && contributorData.payouts.length > 0
    ? contributorData.payouts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map((payout) => {
          const date = new Date(payout.timestamp * 1000)
          const hoursAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
          const amount = payout.amount / 1_0000000
          
          return {
            icon: '💰',
            titulo: 'Pago recibido',
            descripcion: `Tu estudio fue usado en un dataset • hace ${hoursAgo} ${hoursAgo === 1 ? 'hora' : 'horas'}`,
            monto: `+$${amount.toFixed(2)}`,
          }
        })
    : [
        { icon: '💰', titulo: 'Pago recibido', descripcion: 'Tu estudio fue usado en un dataset • hace 2 horas', monto: '+$8.50' },
        { icon: '📤', titulo: 'Estudio procesado', descripcion: 'Análisis hormonal de enero procesado exitosamente • hace 1 día', monto: '✓' },
        { icon: '💰', titulo: 'Pago recibido', descripcion: 'Tu estudio fue usado en un dataset • hace 3 días', monto: '+$8.50' },
      ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 p-8 flex flex-col fixed left-0 top-0 bottom-0">
        <div className="mb-12">
          <h1 className="text-2xl font-black text-[#7B6BA8]">BioChain</h1>
          <p className="text-sm text-gray-500 mt-1">Usuario</p>
        </div>

        <nav className="flex-1">
          {[
            { id: 'inicio', label: 'Inicio', icon: Home },
            { id: 'subir', label: 'Cargar estudios', icon: Upload },
            { id: 'estudios', label: 'Mis estudios', icon: FileText },
            { id: 'wallet', label: 'Wallet', icon: Wallet },
            { id: 'historia', label: 'Historia clínica', icon: User },
            { id: 'config', label: 'Configuración', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'subir' && hasHistory === false) {
                  alert('Debes completar tu Historia Clínica antes de cargar estudios.')
                  navigate('/user/historia-clinica')
                  return
                }
                setActiveTab(id as Tab)
              }}
              className={`w-full flex items-center gap-4 px-6 py-3 mb-2 rounded-xl transition ${
                activeTab === id
                  ? 'bg-[#7B6BA8] text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 font-semibold'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-200">
          <div className="p-4 bg-[#FAFAFA] rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-xl">👤</div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">PAT-8472</h4>
              <p className="text-xs text-gray-500">usuario@email.com</p>
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
        {/* INICIO TAB */}
        {activeTab === 'inicio' && (
          <div>
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-[#7B6BA8] to-[#5D4A7E] rounded-3xl p-12 text-white mb-8">
              <h1 className="text-4xl font-black mb-2">¡Hola! 👋</h1>
              <p className="text-lg opacity-95">
                Bienvenido/a a tu panel de BioChain. Aquí podés gestionar tus estudios y ver tus ganancias.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard label="Estudios cargados" value={stats.estudiosSubidos} />
              <StatCard label="Datasets vendidos" value={stats.datasetsVendidos} />
              <StatCard label="Total ganado" value={`$${stats.totalGanado}`} variant="earnings" />
              <StatCard label="Balance disponible" value={`$${stats.balanceDisponible}`} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <ActionCard
                icon="📄"
                title="Cargar nuevo estudio"
                description="Subí un PDF o foto de tu análisis"
                onClick={() => setActiveTab('subir')}
                variant="orange"
              />
              <ActionCard
                icon="💸"
                title="Retirar fondos"
                description="Transferí tu balance a tu cuenta"
                onClick={() => setActiveTab('wallet')}
              />
            </div>

            {/* Actividad Reciente */}
            <h2 className="text-2xl font-black text-gray-900 mb-6">Actividad reciente</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {actividades.map((actividad, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-xl">
                      {actividad.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{actividad.titulo}</h4>
                      <p className="text-sm text-gray-600">{actividad.descripcion}</p>
                    </div>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      actividad.monto.startsWith('+') ? 'text-[#10B981]' : 'text-[#7B6BA8]'
                    }`}
                  >
                    {actividad.monto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBIR ESTUDIOS TAB */}
        {activeTab === 'subir' && (
          <div>
            {!hasHistory && (
              <InlineWarning message="Debes completar tu Historia Clínica antes de cargar estudios." />
            )}

            <h2 className="text-3xl font-black mb-2">Cargar estudios</h2>
            <p className="text-gray-600 mb-8">
              Subí PDFs o fotos de tus análisis de sangre. Nuestro sistema extraerá los datos automáticamente.
            </p>

            <Link
              to="/user/upload"
              className={`inline-block px-6 py-3 rounded-xl font-bold transition shadow-lg ${
                hasHistory
                  ? 'bg-[#FF6B35] text-white hover:bg-[#FF8C61]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={(e) => {
                if (!hasHistory) {
                  e.preventDefault()
                  navigate('/user/historia-clinica')
                }
              }}
            >
              Subir Nuevo Estudio
            </Link>
          </div>
        )}

        {/* MIS ESTUDIOS TAB */}
        {activeTab === 'estudios' && (
          <div>
            <h2 className="text-3xl font-black mb-2">Tus estudios</h2>
            <p className="text-gray-600 mb-8">Todos los estudios que has cargado y sus estadísticas de uso.</p>
            
            {loadingContributorData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#7B6BA8]" />
              </div>
            ) : contributorData && contributorData.studies.length > 0 ? (
              <div className="space-y-4">
                {contributorData.studies.map((study) => {
                  const usageCount = contributorData.datasetUsage[study.studyId] || 0
                  const studyPayouts = contributorData.payouts.filter(p => p.studyId === study.studyId)
                  const studyEarnings = studyPayouts.reduce((sum, p) => sum + (p.amount / 1_0000000), 0)
                  const date = new Date(study.timestamp * 1000)
                  const formattedDate = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                  
                  return (
                    <div
                      key={study.studyId}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#9B8BC5] rounded-xl flex items-center justify-center text-2xl">
                          🔬
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900">Hash del estudio</h4>
                          <p className="text-sm text-gray-600 font-mono">{study.datasetHash.substring(0, 16)}...</p>
                          <p className="text-xs text-gray-500 mt-1">Fecha de carga: {formattedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="px-4 py-2 bg-[#FAFAFA] rounded-full text-sm text-gray-600">
                          📊 Usado en {usageCount} {usageCount === 1 ? 'dataset' : 'datasets'}
                        </span>
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#FF6B35]">${Math.round(studyEarnings * 100) / 100}</div>
                          <div className="text-xs text-gray-500">ganado</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600">Aún no has subido ningún estudio.</p>
                <Link
                  to="/user/upload"
                  className="inline-block mt-4 px-6 py-3 bg-[#7B6BA8] text-white rounded-xl font-bold hover:bg-[#5D4A7E] transition"
                >
                  Subir tu primer estudio
                </Link>
              </div>
            )}
            
            {/* Recompensas Section */}
            {contributorData && contributorData.payouts.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-black mb-6">Tus recompensas</h3>
                <div className="space-y-3">
                  {contributorData.payouts
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((payout, idx) => {
                      const date = new Date(payout.timestamp * 1000)
                      const formattedDate = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric' })
                      const amount = payout.amount / 1_0000000
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Ganaste {amount.toFixed(2)} USDC
                            </p>
                            <p className="text-xs text-gray-600">
                              Estudio usado en dataset • {formattedDate}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-[#10B981]">+${amount.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="max-w-4xl">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8C61] rounded-3xl p-12 text-white text-center mb-8">
              <div className="text-base opacity-90 mb-2">Total ganado</div>
              <div className="text-6xl font-black mb-6">
                ${loadingContributorData ? '...' : stats.totalGanado}
              </div>
              <div className="text-sm opacity-80">USDC</div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    alert('Función de retiro en desarrollo. Próximamente podrás retirar tus ganancias a tu wallet Stellar.')
                  }}
                  className="px-6 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white font-bold hover:bg-white/30 transition"
                >
                  💸 Retirar
                </button>
                <button
                  onClick={() => {
                    alert('Función de fondeo en desarrollo. Próximamente podrás fondear tu wallet desde aquí.')
                  }}
                  className="px-6 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white font-bold hover:bg-white/30 transition"
                >
                  ➕ Fondear
                </button>
              </div>
            </div>

                {/* Wallet Address */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                  <h3 className="text-base font-bold text-gray-900 mb-3">📍 Tu dirección de wallet</h3>
                  <div className="flex items-center gap-4 p-4 bg-[#FAFAFA] rounded-xl">
                    <code className="flex-1 font-mono text-sm text-gray-600">
                      {walletAddress || 'No conectada'}
                    </code>
                    {walletAddress && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress)
                          alert('Wallet address copiada al portapapeles')
                        }}
                        className="px-4 py-2 bg-[#7B6BA8] text-white rounded-lg text-sm font-semibold hover:bg-[#5D4A7E] transition"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tu wallet Stellar (Account Abstraction)
                  </p>
                </div>
                
                {/* USDC Balance */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                  <h3 className="text-base font-bold text-gray-900 mb-3">💵 Balance USDC</h3>
                  <div className="p-4 bg-[#FAFAFA] rounded-xl">
                    {loadingContributorData ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#7B6BA8]" />
                        <span className="text-sm text-gray-600">Cargando balance...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-[#10B981]">
                        ${stats.balanceDisponible} USDC
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Balance disponible en tu wallet (mock - en producción se leería desde Stellar)
                  </p>
                </div>

            {/* Transactions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Historial de transacciones</h3>
              {loadingContributorData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7B6BA8]" />
                </div>
              ) : contributorData && contributorData.payouts.length > 0 ? (
                contributorData.payouts
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((payout, idx) => {
                    const date = new Date(payout.timestamp * 1000)
                    const formattedDate = date.toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    const amount = payout.amount / 1_0000000

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Pago recibido por uso de estudio
                          </h4>
                          <p className="text-sm text-gray-600">
                            Estudio usado en dataset • {formattedDate}
                          </p>
                        </div>
                        <div className="text-lg font-bold text-[#10B981]">+${amount.toFixed(2)}</div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-sm">Aún no has recibido ningún pago.</p>
                  <p className="text-xs mt-2">Los pagos aparecerán aquí cuando tus estudios sean usados en datasets.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORIA CLÍNICA TAB */}
        {activeTab === 'historia' && (
          <div>
            <h2 className="text-3xl font-black mb-2">📋 Mi historia clínica</h2>
            <p className="text-gray-600 mb-8">Información sobre tu salud y condiciones médicas.</p>
            <Link
              to="/user/historia-clinica"
              className="inline-block px-6 py-3 bg-[#7B6BA8] text-white rounded-xl font-bold hover:bg-[#5D4A7E] transition shadow-lg"
            >
              ✏️ Editar Historia Clínica
            </Link>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div>
            <h2 className="text-3xl font-black mb-8">⚙️ Configuración</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="text-lg font-bold text-[#7B6BA8] mb-4 flex items-center gap-2">🔔 Notificaciones</div>
                <div className="space-y-4">
                  {[
                    'Notificarme cuando vendan mi dataset',
                    'Notificarme cuando reciba un pago',
                    'Recibir newsletter con novedades',
                  ].map((notif, idx) => (
                    <label key={idx} className="flex items-center gap-4 cursor-pointer">
                      <input type="checkbox" defaultChecked={idx < 2} className="w-5 h-5 accent-[#7B6BA8]" />
                      <span className="text-sm text-gray-800">{notif}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <div className="text-lg font-bold text-[#7B6BA8] mb-4 flex items-center gap-2">🔐 Seguridad</div>
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-[#FAFAFA] text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-100">
                    Cambiar contraseña
                  </button>
                  <button className="px-6 py-2 bg-[#FAFAFA] text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-100">
                    Activar 2FA
                  </button>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <div className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">⚠️ Zona de peligro</div>
                <button className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100">
                  Eliminar mi cuenta y datos
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
