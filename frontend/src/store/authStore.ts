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
      setAuth: (walletAddress, publicKey, userType, account) =>
        set({
          isAuthenticated: true,
          walletAddress,
          publicKey,
          userType,
          account,
        }),
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

