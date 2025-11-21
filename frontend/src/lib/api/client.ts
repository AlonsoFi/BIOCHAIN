import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar wallet address y token
apiClient.interceptors.request.use((config) => {
  // Agregar wallet address desde el store
  const walletAddress = useAuthStore.getState().walletAddress
  if (walletAddress) {
    config.headers['x-wallet-address'] = walletAddress
  }

  // Agregar token si existe (para futuras implementaciones)
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

export default apiClient

