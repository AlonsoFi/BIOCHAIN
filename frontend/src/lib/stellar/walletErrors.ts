/**
 * Wallet Connection Error Types
 * 
 * Define tipos de errores específicos para la conexión de wallet
 */

export enum WalletErrorType {
  // Errores de configuración
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  
  // Errores de autenticación
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_CANCELLED = 'AUTH_CANCELLED',
  AUTH_TIMEOUT = 'AUTH_TIMEOUT',
  
  // Errores de wallet
  WALLET_GENERATION_FAILED = 'WALLET_GENERATION_FAILED',
  WALLET_INVALID = 'WALLET_INVALID',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  
  // Errores de red
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // Errores de SDK
  SDK_NOT_AVAILABLE = 'SDK_NOT_AVAILABLE',
  SDK_INIT_FAILED = 'SDK_INIT_FAILED',
  
  // Errores desconocidos
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class WalletError extends Error {
  type: WalletErrorType
  originalError?: Error
  details?: Record<string, any>

  constructor(
    type: WalletErrorType,
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = 'WalletError'
    this.type = type
    this.originalError = originalError
    this.details = details
  }

  /**
   * Obtiene un mensaje amigable para el usuario
   */
  getUserMessage(): string {
    switch (this.type) {
      case WalletErrorType.CONFIG_MISSING:
        return 'La configuración de la wallet no está completa. Por favor, contacta al soporte.'
      
      case WalletErrorType.CONFIG_INVALID:
        return 'La configuración de la wallet es inválida. Por favor, verifica la configuración.'
      
      case WalletErrorType.AUTH_FAILED:
        return 'No se pudo autenticar con Google. Por favor, intenta de nuevo.'
      
      case WalletErrorType.AUTH_CANCELLED:
        return 'Autenticación cancelada. Por favor, intenta de nuevo cuando estés listo.'
      
      case WalletErrorType.AUTH_TIMEOUT:
        return 'La autenticación tardó demasiado. Por favor, intenta de nuevo.'
      
      case WalletErrorType.WALLET_GENERATION_FAILED:
        return 'No se pudo generar la wallet. Por favor, intenta de nuevo.'
      
      case WalletErrorType.WALLET_INVALID:
        return 'La wallet generada no es válida. Por favor, intenta de nuevo.'
      
      case WalletErrorType.WALLET_NOT_FOUND:
        return 'No se encontró la wallet. Por favor, inicia sesión de nuevo.'
      
      case WalletErrorType.NETWORK_ERROR:
        return 'Error de conexión. Por favor, verifica tu internet e intenta de nuevo.'
      
      case WalletErrorType.NETWORK_TIMEOUT:
        return 'La conexión tardó demasiado. Por favor, intenta de nuevo.'
      
      case WalletErrorType.SDK_NOT_AVAILABLE:
        return 'El servicio de wallet no está disponible. Por favor, intenta más tarde.'
      
      case WalletErrorType.SDK_INIT_FAILED:
        return 'No se pudo inicializar el servicio de wallet. Por favor, intenta de nuevo.'
      
      default:
        return this.message || 'Ocurrió un error al conectar la wallet. Por favor, intenta de nuevo.'
    }
  }

  /**
   * Verifica si el error es recuperable
   */
  isRecoverable(): boolean {
    const nonRecoverable = [
      WalletErrorType.CONFIG_MISSING,
      WalletErrorType.CONFIG_INVALID,
      WalletErrorType.SDK_NOT_AVAILABLE,
    ]
    return !nonRecoverable.includes(this.type)
  }
}

/**
 * Crea un WalletError desde un error genérico
 */
export function createWalletError(
  error: unknown,
  fallbackType: WalletErrorType = WalletErrorType.UNKNOWN_ERROR
): WalletError {
  if (error instanceof WalletError) {
    return error
  }

  if (error instanceof Error) {
    // Detectar tipos de error comunes
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return new WalletError(
        WalletErrorType.NETWORK_ERROR,
        'Error de conexión de red',
        error
      )
    }
    
    if (message.includes('timeout')) {
      return new WalletError(
        WalletErrorType.NETWORK_TIMEOUT,
        'Timeout de conexión',
        error
      )
    }
    
    if (message.includes('cancelled') || message.includes('canceled')) {
      return new WalletError(
        WalletErrorType.AUTH_CANCELLED,
        'Autenticación cancelada',
        error
      )
    }
    
    return new WalletError(
      fallbackType,
      error.message || 'Error desconocido',
      error
    )
  }

  return new WalletError(
    fallbackType,
    'Error desconocido al conectar la wallet',
    undefined,
    { originalError: error }
  )
}

