/**
 * Blockchain service for dataset purchases
 * 
 * Handles end-to-end dataset purchase flow:
 * 1. Build Soroban transaction
 * 2. Sign with abstracted wallet
 * 3. Submit to Stellar testnet
 * 4. Wait for confirmation
 * 5. Parse and log events
 */

import { Server, Contract, Networks, TransactionBuilder, Keypair, xdr } from 'soroban-client'
import { useAuthStore } from '@/store/authStore'
import { purchaseDatasetOnChain } from '@/lib/api/sorobanApi'

// Configuration
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'
const RPC_URL =
  NETWORK === 'testnet'
    ? 'https://soroban-testnet.stellar.org'
    : 'https://soroban-mainnet.stellar.org'

// Contract IDs (from environment or defaults)
const CONTRACT_IDS = {
  DATASET_MARKETPLACE: import.meta.env.VITE_CONTRACT_MARKETPLACE || 'mock_contract_id',
  REVENUE_SPLITTER: import.meta.env.VITE_CONTRACT_REVENUE || 'mock_contract_id',
}

/**
 * Get Soroban RPC server
 */
const getSorobanRpc = (): Server => {
  return new Server(RPC_URL, { allowHttp: true })
}

/**
 * Get abstracted wallet from auth store
 */
const getWallet = () => {
  const { walletAddress, publicKey, secretKey } = useAuthStore.getState()
  
  if (!publicKey || !walletAddress) {
    throw new Error('No hay wallet conectada. Por favor, inicia sesión primero.')
  }
  
  // In production, this would use the Account Abstraction SDK
  // For now, we use the stored wallet info
  return {
    address: walletAddress,
    publicKey,
    secretKey, // In production, this would come from secure storage
  }
}

/**
 * Build Soroban transaction for dataset purchase
 * 
 * Note: This is a simplified implementation for the hackathon.
 * In production, this would use proper Soroban SDK methods.
 */
const buildPurchaseTransaction = async (
  datasetId: string,
  buyerAddress: string
): Promise<any> => {
  const server = getSorobanRpc()
  const contractId = CONTRACT_IDS.DATASET_MARKETPLACE
  
  // Check if using mock contract
  if (contractId === 'mock_contract_id') {
    // Return mock transaction object
    return {
      isMock: true,
      datasetId,
      buyerAddress,
    }
  }
  
  // Get source account
  const sourceKeypair = Keypair.fromPublicKey(buyerAddress)
  const sourceAccount = await server.getAccount(sourceKeypair.publicKey())
  
  // Build contract call
  const contract = new Contract(contractId)
  
  // Convert datasetId to Bytes (Soroban type)
  const datasetIdBytes = Buffer.from(datasetId, 'utf-8')
  
  // Convert buyer address to ScAddress
  const buyerKeypair = Keypair.fromPublicKey(buyerAddress)
  const buyerScAddress = xdr.ScAddress.scAddressTypeAccount(
    xdr.PublicKey.publicKeyTypeEd25519(buyerKeypair.rawPublicKey())
  )
  
  // Build transaction
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'purchase_dataset',
        xdr.ScVal.scvBytes(datasetIdBytes),
        xdr.ScVal.scvAddress(buyerScAddress)
      )
    )
    .setTimeout(30)
    .build()
  
  return transaction
}

/**
 * Purchase a dataset on-chain
 *
 * This function calls the backend Soroban service which:
 * 1. Gets the abstracted wallet
 * 2. Builds the Soroban transaction
 * 3. Signs it
 * 4. Submits to Stellar testnet
 * 5. Waits for confirmation
 * 6. Parses and logs events
 *
 * @param datasetId - ID of the dataset to purchase
 * @returns Transaction confirmation with events
 */
export async function purchaseDataset(datasetId: string): Promise<{
  hash: string
  events: any[]
  success: boolean
}> {
  console.log('🟣 Starting dataset purchase flow...', { datasetId })

  try {
    // Use backend Soroban service
    const result = await purchaseDatasetOnChain(datasetId)
    
    console.log('✅ Dataset purchased successfully:', {
      transactionHash: result.transactionHash,
      datasetId: result.datasetId,
      priceUsdc: result.priceUsdc,
    })

    // Return in expected format
    return {
      hash: result.transactionHash,
      events: [], // Events are logged in backend
      success: true,
    }
  } catch (error: any) {
    console.error('❌ Purchase error:', error)
    throw error
  }
}

/**
 * OLD IMPLEMENTATION - Kept for reference
 * This was the direct frontend implementation, now we use backend
 */
async function purchaseDatasetDirect(datasetId: string): Promise<{
  hash: string
  events: any[]
  success: boolean
}> {
  console.log('🟣 Starting dataset purchase flow (direct)...', { datasetId })

  try {
    // 1. Get abstracted wallet
    const wallet = getWallet()
    console.log('📱 Wallet obtained:', {
      address: wallet.address.substring(0, 8) + '...',
      publicKey: wallet.publicKey.substring(0, 8) + '...',
    })
    
    // 2. Build Soroban transaction
    console.log('🔨 Building transaction...')
    const transaction = await buildPurchaseTransaction(datasetId, wallet.address)
    
    // Check if using mock
    if (transaction.isMock) {
      console.log('⚠️ Using mock transaction (contract not deployed)')
      console.log('✅ Transaction built (mock):', {
        datasetId: transaction.datasetId,
        buyer: transaction.buyerAddress.substring(0, 8) + '...',
      })
      
      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Return mock result with events
      const mockHash = 'mock_tx_hash_' + Date.now()
      const mockEvents = [
        {
          type: 'ContributorRewarded',
          contract: CONTRACT_IDS.REVENUE_SPLITTER,
          data: {
            dataset_id: datasetId,
            contributor: wallet.address.substring(0, 8) + '...',
            user_amount: '8.5 USDC',
            platform_amount: '1.5 USDC',
          },
        },
        {
          type: 'DatasetPayoutCompleted',
          contract: CONTRACT_IDS.REVENUE_SPLITTER,
          data: {
            dataset_id: datasetId,
            num_contributors: 1,
            total_user_amount: '8.5 USDC',
            total_platform_amount: '1.5 USDC',
          },
        },
      ]
      
      console.log('📡 Purchase Transaction Sent (mock):', {
        hash: mockHash,
        status: 'SUCCESS',
      })
      
      console.log('🟣 TX CONFIRMED (mock):', {
        hash: mockHash,
        status: 'SUCCESS',
      })
      
      // Log events
      mockEvents.forEach((evt, idx) => {
        console.log(`📣 EVENT [${idx}]:`, evt)
        if (evt.type === 'ContributorRewarded') {
          console.log('💰 ContributorRewarded:', {
            dataset: evt.data.dataset_id,
            contributor: evt.data.contributor,
            user_amount: evt.data.user_amount,
            platform_amount: evt.data.platform_amount,
          })
        } else if (evt.type === 'DatasetPayoutCompleted') {
          console.log('✅ DatasetPayoutCompleted:', {
            dataset: evt.data.dataset_id,
            num_contributors: evt.data.num_contributors,
            total_user_amount: evt.data.total_user_amount,
            total_platform_amount: evt.data.total_platform_amount,
          })
        }
      })
      
      return {
        hash: mockHash,
        events: mockEvents,
        success: true,
      }
    }
    
    // Real transaction flow (when contract is deployed)
    console.log('✅ Transaction built:', {
      source: transaction.source,
      operations: transaction.operations.length,
    })
    
    // 3. Sign transaction
    console.log('✍️ Signing transaction...')
    const keypair = Keypair.fromPublicKey(wallet.publicKey)
    transaction.sign(keypair)
    console.log('✅ Transaction signed')
    
    // 4. Send transaction
    console.log('📡 Sending transaction to Stellar testnet...')
    const server = getSorobanRpc()
    const sendResult = await server.sendTransaction(transaction)
    console.log('📡 Purchase Transaction Sent:', {
      hash: sendResult.hash,
      status: sendResult.status,
    })
    
    // 5. Wait for confirmation
    console.log('⏳ Waiting for transaction confirmation...')
    let txResult
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      try {
        txResult = await server.getTransaction(sendResult.hash)
        if (txResult.status === 'SUCCESS') {
          break
        }
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
    }
    
    if (!txResult || txResult.status !== 'SUCCESS') {
      throw new Error('Transaction confirmation timeout')
    }
    
    console.log('🟣 TX CONFIRMED:', {
      hash: sendResult.hash,
      status: txResult.status,
      ledger: txResult.ledger,
    })
    
    // 6. Parse events
    const events = txResult.resultMetaXdr?.v3()?.sorobanMeta()?.events() || []
    console.log('📣 Transaction Events:', events.length)
    
    // Parse and log RevenueSplitter events
    const parsedEvents: any[] = []
    events.forEach((event, index) => {
      try {
        const eventData = event.data()
        const eventType = event.type()
        
        const parsedEvent = {
          type: eventType?.name || 'Unknown',
          contract: event.contractId()?.toString() || 'Unknown',
          data: eventData,
        }
        
        console.log(`📣 EVENT [${index}]:`, parsedEvent)
        parsedEvents.push(parsedEvent)
        
        // Check for ContributorRewarded events
        if (eventType?.name === 'Contract' && eventData) {
          const contractEvent = eventData.contract()
          if (contractEvent) {
            const topics = contractEvent.topics()
            if (topics && topics.length > 0) {
              const topicStr = topics[0]?.sym()?.toString() || ''
              if (topicStr.includes('ContributorRewarded')) {
                console.log('💰 ContributorRewarded event detected:', {
                  study: topics[1]?.toString() || 'N/A',
                  contributor: topics[2]?.toString() || 'N/A',
                  amount: topics[3]?.toString() || 'N/A',
                })
              } else if (topicStr.includes('DatasetPayoutCompleted')) {
                console.log('✅ DatasetPayoutCompleted event detected:', {
                  dataset: topics[1]?.toString() || 'N/A',
                  totalAmount: topics[2]?.toString() || 'N/A',
                })
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error parsing event:', error)
      }
    })
    
    return {
      hash: sendResult.hash,
      events: parsedEvents,
      success: true,
    }
  } catch (error: any) {
    console.error('❌ Purchase error:', error)
    
    // In development, return mock success if real transaction fails
    if (CONTRACT_IDS.DATASET_MARKETPLACE === 'mock_contract_id') {
      console.warn('⚠️ Using mock transaction (contract not deployed)')
      return {
        hash: 'mock_tx_hash_' + Date.now(),
        events: [
          {
            type: 'ContributorRewarded',
            contract: CONTRACT_IDS.REVENUE_SPLITTER,
            data: {
              dataset_id: datasetId,
              contributor: 'GABC...',
              user_amount: '8.5 USDC',
              platform_amount: '1.5 USDC',
            },
          },
          {
            type: 'DatasetPayoutCompleted',
            contract: CONTRACT_IDS.REVENUE_SPLITTER,
            data: {
              dataset_id: datasetId,
              num_contributors: 1,
              total_user_amount: '8.5 USDC',
              total_platform_amount: '1.5 USDC',
            },
          },
        ],
        success: true,
      }
    }
    
    throw error
  }
}

