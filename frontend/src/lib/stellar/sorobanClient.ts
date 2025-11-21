/**
 * Cliente Soroban para interactuar con smart contracts
 */

import { SorobanRpc, Contract, Networks, xdr } from 'soroban-client'
import { useAuthStore } from '@/store/authStore'

// Configuración
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'
const RPC_URL =
  NETWORK === 'testnet'
    ? 'https://soroban-testnet.stellar.org'
    : 'https://soroban-mainnet.stellar.org'

// TODO: Contract IDs reales después de deploy
const CONTRACT_IDS = {
  STUDY_REGISTRY: import.meta.env.VITE_CONTRACT_STUDY_REGISTRY || 'mock_contract_id',
  DATASET_MARKETPLACE: import.meta.env.VITE_CONTRACT_MARKETPLACE || 'mock_contract_id',
  REVENUE_SPLITTER: import.meta.env.VITE_CONTRACT_REVENUE || 'mock_contract_id',
}

/**
 * Obtiene cliente RPC de Soroban
 * Mock para desarrollo - en producción usar SDK real
 */
export const getSorobanRpc = (): any => {
  try {
    // Intentar usar SorobanRpc real si está disponible
    if (SorobanRpc && SorobanRpc.Server) {
      return new SorobanRpc.Server(RPC_URL, { allowHttp: true })
    }
  } catch (error) {
    console.warn('SorobanRpc.Server no disponible, usando mock:', error)
  }
  
  // Mock para desarrollo
  return {
    getNetwork: () => Promise.resolve({ passphrase: NETWORK }),
    simulateTransaction: () => Promise.resolve({ result: 'mock_simulation' }),
    sendTransaction: () => Promise.resolve({ hash: 'mock_tx_hash' }),
  }
}

/**
 * Obtiene contrato StudyRegistry
 */
export const getStudyRegistryContract = (): Contract => {
  return new Contract(CONTRACT_IDS.STUDY_REGISTRY)
}

/**
 * Verifica si un hash ya está registrado en blockchain (anti-duplicado on-chain)
 * 
 * Paso C del anti-duplicado: Verificación en Soroban contract
 */
export const checkHashNotRegistered = async (datasetHash: string): Promise<boolean> => {
  try {
    // Mock: siempre permite (en producción verificaría en blockchain)
    // TODO: Implementar verificación real cuando el contrato esté deployado
    console.log('Verificando hash en blockchain (mock):', datasetHash.substring(0, 16) + '...')
    return true // Hash no está registrado, puede continuar
  } catch (error) {
    console.error('Error verificando hash:', error)
    // En caso de error, asumir que no está registrado para no bloquear
    return true
  }
}

/**
 * Registra un estudio en el smart contract (con verificación de duplicado)
 */
export const registerStudy = async (
  zkProof: string,
  attestation: string,
  datasetHash: string,
  cycleTimestamp: number
): Promise<string> => {
  const { publicKey } = useAuthStore.getState()
  if (!publicKey) {
    throw new Error('No hay wallet conectada')
  }

  // Verificar duplicado on-chain (Paso C)
  const hashNotRegistered = await checkHashNotRegistered(datasetHash)
  if (!hashNotRegistered) {
    throw new Error('Este estudio ya está registrado en blockchain (duplicado)')
  }

  try {
    // Mock para desarrollo - en producción usar SDK real
    // TODO: Implementar registro real cuando el contrato esté deployado
    console.log('Simulando register_study (mock):', { 
      zkProof: zkProof.substring(0, 20) + '...', 
      attestation: attestation.substring(0, 20) + '...', 
      datasetHash: datasetHash.substring(0, 16) + '...', 
      cycleTimestamp 
    })
    return 'mock_tx_hash_' + Date.now()
  } catch (error) {
    console.error('Error registrando estudio:', error)
    throw error
  }
}

/**
 * Compra un dataset en el marketplace
 */
export const purchaseDataset = async (datasetId: string): Promise<string> => {
  const { publicKey } = useAuthStore.getState()
  if (!publicKey) {
    throw new Error('No hay wallet conectada')
  }

  try {
    // Mock para desarrollo - en producción usar SDK real
    // TODO: Implementar compra real cuando el contrato esté deployado
    console.log('Simulando purchase_dataset (mock):', datasetId)
    return 'mock_tx_hash_' + Date.now()
  } catch (error) {
    console.error('Error comprando dataset:', error)
    throw error
  }
}

