import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  userType: 'contributor' | 'researcher' | null
  walletAddress: string | null
  publicKey: string | null
  account: any | null
  setAuth: (walletAddress: string, publicKey: string, userType: 'contributor' | 'researcher', account?: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      walletAddress: null,
      publicKey: null,
      account: null,
      setAuth: (walletAddress, publicKey, userType, account) => {
        // Validar datos antes de guardar
        if (!walletAddress || !publicKey) {
          throw new Error('Wallet address y public key son requeridos')
        }

        // Validar formato de dirección Stellar
        if (!walletAddress.startsWith('G') || walletAddress.length !== 56) {
          throw new Error('Dirección de wallet inválida')
        }

        // Validar formato de public key
        if (publicKey.length < 56) {
          throw new Error('Public key inválida')
        }

        set({
          isAuthenticated: true,
          walletAddress,
          publicKey,
          userType,
          account,
        })
      },
      logout: () =>
        set({
          isAuthenticated: false,
          userType: null,
          walletAddress: null,
          publicKey: null,
          account: null,
        }),
    }),
    {
      name: 'biochain-auth',
    }
  )
)

