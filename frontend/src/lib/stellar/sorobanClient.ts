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
 */
export const getSorobanRpc = (): SorobanRpc.Server => {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: true })
}

/**
 * Obtiene contrato StudyRegistry
 */
export const getStudyRegistryContract = (): Contract => {
  return new Contract(CONTRACT_IDS.STUDY_REGISTRY)
}

/**
 * Registra un estudio en el smart contract
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

  const contract = getStudyRegistryContract()
  const rpc = getSorobanRpc()

  try {
    // Construir parámetros
    const args = [
      xdr.ScVal.scvString(zkProof),
      xdr.ScVal.scvString(attestation),
      xdr.ScVal.scvString(datasetHash),
      xdr.ScVal.scvI64(xdr.Int64.fromString(cycleTimestamp.toString())),
    ]

    // Simular transacción
    const simResult = await contract.simulateTransaction(
      contract.call('register_study', ...args),
      { rpc, source: publicKey }
    )

    // TODO: Firmar y enviar transacción real
    // const tx = await contract.transaction('register_study', ...args)
    // const signedTx = await signTransaction(tx, publicKey)
    // const result = await rpc.sendTransaction(signedTx)

    // Mock para desarrollo
    console.log('Simulando register_study:', { zkProof, attestation, datasetHash, cycleTimestamp })
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

  const contract = new Contract(CONTRACT_IDS.DATASET_MARKETPLACE)
  const rpc = getSorobanRpc()

  try {
    // TODO: Implementar compra real
    // const args = [xdr.ScVal.scvString(datasetId)]
    // const tx = await contract.transaction('purchase_dataset', ...args)
    // const signedTx = await signTransaction(tx, publicKey)
    // const result = await rpc.sendTransaction(signedTx)

    // Mock para desarrollo
    console.log('Simulando purchase_dataset:', datasetId)
    return 'mock_tx_hash_' + Date.now()
  } catch (error) {
    console.error('Error comprando dataset:', error)
    throw error
  }
}

