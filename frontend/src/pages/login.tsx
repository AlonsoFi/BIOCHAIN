import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { loginWithGoogle } from '@/lib/stellar/accountAbstraction'
import { useAuthStore } from '@/store/authStore'
import { WalletError } from '@/lib/stellar/walletErrors'
import { LogIn, Home, Loader2, AlertCircle } from 'lucide-react'
import { WalletButton } from '@/lib/paltalabs/components'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userType = searchParams.get('type') || 'contributor'
  const { setAuth, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(userType === 'researcher' ? '/researcher/dashboard' : '/user/dashboard')
    }
  }, [isAuthenticated, navigate, userType])

  const handleGoogleLogin = async () => {
    // Resetear errores previos
    setError(null)
    setLoading(true)

    try {
      console.log('🔄 Iniciando autenticación...')
      
      // Validar que podemos generar la wallet
      const result = await loginWithGoogle()
      
      // Validar resultado antes de guardar
      if (!result.walletAddress || !result.publicKey) {
        throw new WalletError(
          WalletErrorType.WALLET_INVALID,
          'La wallet generada no contiene datos válidos'
        )
      }

      // Validar formato de dirección Stellar (debe empezar con G y tener 56 caracteres)
      if (!result.walletAddress.startsWith('G') || result.walletAddress.length !== 56) {
        throw new WalletError(
          WalletErrorType.WALLET_INVALID,
          'La dirección de wallet no tiene el formato correcto'
        )
      }
      
      console.log('✅ Wallet generada correctamente:', {
        walletAddress: result.walletAddress.substring(0, 8) + '...',
        publicKey: result.publicKey.substring(0, 10) + '...',
      })
      
      // Guardar en el store
      try {
        setAuth(
          result.walletAddress,
          result.publicKey,
          userType as 'contributor' | 'researcher',
          result.account
        )
        console.log('✅ Wallet guardada en store')
      } catch (storeError) {
        console.error('❌ Error guardando wallet en store:', storeError)
        throw new WalletError(
          WalletErrorType.WALLET_NOT_FOUND,
          'No se pudo guardar la wallet. Por favor, intenta de nuevo.',
          storeError instanceof Error ? storeError : undefined
        )
      }
      
      // Navegar al dashboard
      console.log('🔄 Navegando al dashboard...')
      navigate(userType === 'researcher' ? '/researcher/dashboard' : '/user/dashboard')
    } catch (error) {
      console.error('❌ Error en login:', error)
      
      // Manejar errores específicos
      if (error instanceof WalletError) {
        const userMessage = error.getUserMessage()
        setError(userMessage)
        console.error('📋 Detalles del error:', {
          type: error.type,
          message: error.message,
          recoverable: error.isRecoverable(),
          details: error.details,
        })
      } else {
        // Error desconocido
        setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
        console.error('❌ Error desconocido:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stellar-primary via-purple-900 to-stellar-secondary flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full relative">
        <Link
          to="/"
          className="absolute top-4 left-4 text-gray-600 hover:text-stellar-primary transition flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm">Volver</span>
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2">BioChain</h1>
        <p className="text-center text-gray-600 mb-8">
          {userType === 'researcher' ? 'Acceso Investigador' : 'Acceso Usuario'}
        </p>

        <div className="w-full">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  Si el problema persiste, recarga la página o contacta al soporte.
                </p>
              </div>
            </div>
          )}

          <WalletButton
            onConnect={handleGoogleLogin}
            connected={isAuthenticated}
            address={useAuthStore.getState().walletAddress || undefined}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Continuar con Google
              </>
            )}
          </WalletButton>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          Al continuar, se creará automáticamente una wallet Stellar para ti
        </p>
      </div>
    </div>
  )
}

