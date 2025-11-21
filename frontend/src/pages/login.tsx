import { useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { loginWithGoogle } from '@/lib/stellar/accountAbstraction'
import { useAuthStore } from '@/store/authStore'
import { LogIn, Home } from 'lucide-react'
import { WalletButton } from '@/lib/paltalabs/components'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userType = searchParams.get('type') || 'contributor'
  const { setAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(userType === 'researcher' ? '/researcher/dashboard' : '/user/dashboard')
    }
  }, [isAuthenticated, navigate, userType])

  const handleGoogleLogin = async () => {
    try {
      // Mostrar mensaje de que se está conectando
      console.log('Iniciando autenticación...')
      
      const result = await loginWithGoogle()
      
      // Guardar en el store
      setAuth(
        result.walletAddress,
        result.publicKey,
        userType as 'contributor' | 'researcher',
        result.account
      )
      
      console.log('Autenticación exitosa:', {
        walletAddress: result.walletAddress,
        publicKey: result.publicKey.substring(0, 10) + '...',
      })
      
      // Navegar al dashboard
      navigate(userType === 'researcher' ? '/researcher/dashboard' : '/user/dashboard')
    } catch (error) {
      console.error('Error en login:', error)
      alert('Error al iniciar sesión. Intenta de nuevo.')
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
          <WalletButton
            onConnect={handleGoogleLogin}
            connected={isAuthenticated}
            address={useAuthStore.getState().walletAddress || undefined}
            className="w-full flex items-center justify-center gap-3"
          >
            <LogIn className="w-5 h-5" />
            Continuar con Google
          </WalletButton>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          Al continuar, se creará automáticamente una wallet Stellar para ti
        </p>
      </div>
    </div>
  )
}

