/**
 * Soroban Client for Backend
 * 
 * Handles all Soroban blockchain interactions:
 * - Transaction preparation
 * - Simulation
 * - Signing (via Account Abstraction)
 * - Submission to testnet
 * - Result parsing
 */

import { Server, Contract, Networks, TransactionBuilder, Keypair, xdr } from 'soroban-client'
import { SorobanRpc } from 'soroban-client'
import logger from '../utils/logger.js'

// Configuration
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET_PASSPHRASE

// Contract IDs (from environment)
const CONTRACT_IDS = {
  STUDY_REGISTRY: process.env.CONTRACT_STUDY_REGISTRY || '',
  DATASET_MARKETPLACE: process.env.CONTRACT_MARKETPLACE || '',
  REVENUE_SPLITTER: process.env.CONTRACT_REVENUE_SPLITTER || '',
}

/**
 * Initialize Soroban RPC client
 */
export const initSorobanClient = (): Server => {
  try {
    const rpc = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: true })
    logger.info('Soroban RPC client initialized', { url: SOROBAN_RPC_URL })
    return rpc
  } catch (error: any) {
    logger.error('Failed to initialize Soroban RPC client', {
      error: error.message,
      url: SOROBAN_RPC_URL,
    })
    throw new Error(`Failed to initialize Soroban client: ${error.message}`)
  }
}

/**
 * Get source account for transaction building
 */
const getSourceAccount = async (rpc: Server, publicKey: string) => {
  try {
    const account = await rpc.getAccount(publicKey)
    return account
  } catch (error: any) {
    logger.error('Failed to get source account', {
      error: error.message,
      publicKey: publicKey.substring(0, 8) + '...',
    })
    throw new Error(`Failed to get account: ${error.message}`)
  }
}

/**
 * Prepare a contract call transaction
 * 
 * This function:
 * 1. Builds the contract call
 * 2. Simulates the transaction
 * 3. Gets the footprint
 * 4. Constructs the final transaction with correct fees and ledger bounds
 * 
 * @param contractId - Contract address
 * @param method - Method name to call
 * @param args - Arguments for the method (will be serialized to XDR)
 * @param userAddress - User's Stellar address (for source account)
 * @returns Transaction XDR ready to sign
 */
export const prepareContractCall = async (
  contractId: string,
  method: string,
  args: any[],
  userAddress: string
): Promise<string> => {
  const rpc = initSorobanClient()
  
  logger.info('Preparing contract call', {
    contractId: contractId.substring(0, 8) + '...',
    method,
    userAddress: userAddress.substring(0, 8) + '...',
  })

  try {
    // 1. Get source account
    const sourceAccount = await getSourceAccount(rpc, userAddress)

    // 2. Build contract call
    const contract = new Contract(contractId)
    
    // Args should already be XDR ScVal objects from the service layer
    // If they're not, we'll handle conversion here
    const xdrArgs = args.map((arg) => {
      // If already ScVal, return as is
      if (arg instanceof xdr.ScVal) {
        return arg
      }
      
      // Handle different types
      if (typeof arg === 'string') {
        // Try to detect if it's hex (hash) or regular string
        if (arg.length === 64 && /^[0-9a-fA-F]+$/.test(arg)) {
          // It's a hex hash, convert to BytesN<32>
          const hashBytes = Buffer.from(arg, 'hex')
          if (hashBytes.length === 32) {
            return xdr.ScVal.scvBytes(hashBytes)
          }
        }
        // Regular string, convert to Bytes
        return xdr.ScVal.scvBytes(Buffer.from(arg, 'utf-8'))
      } else if (typeof arg === 'number') {
        return xdr.ScVal.scvI128(xdr.Int128Parts.fromString(arg.toString()))
      } else if (arg instanceof Buffer) {
        return xdr.ScVal.scvBytes(arg)
      }
      // Default: try to serialize as string
      return xdr.ScVal.scvBytes(Buffer.from(String(arg), 'utf-8'))
    })

    // 3. Build transaction with contract call
    // Note: contract.call() expects method name and args array
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(method, xdrArgs)
      )
      .setTimeout(30)
      .build()

    // 4. Simulate transaction to get footprint
    logger.debug('Simulating transaction', { method })
    const simulation = await rpc.simulateTransaction(transaction)

    if (simulation.errorResult) {
      throw new Error(`Simulation failed: ${simulation.errorResult.value().toString()}`)
    }

    // 5. Get footprint from simulation
    const footprint = simulation.transactionData?.footprint
    if (!footprint) {
      throw new Error('No footprint returned from simulation')
    }

    // 6. Build final transaction with footprint
    const finalTransaction = new TransactionBuilder(sourceAccount, {
      fee: simulation.minResourceFee || '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(method, xdrArgs)
      )
      .setTimeout(30)
      .build()

    // Set footprint
    finalTransaction.setSorobanData(simulation.transactionData)

    // 7. Convert to XDR string
    const txXdr = finalTransaction.toXDR()
    
    logger.info('Transaction prepared successfully', {
      method,
      fee: simulation.minResourceFee,
    })

    return txXdr
  } catch (error: any) {
    logger.error('Failed to prepare contract call', {
      error: error.message,
      stack: error.stack,
      contractId: contractId.substring(0, 8) + '...',
      method,
    })
    throw new Error(`Failed to prepare transaction: ${error.message}`)
  }
}

/**
 * Sign transaction with Account Abstraction wallet
 * 
 * Note: In production, this would use Hoblayerta SDK.
 * For now, we'll use a mock signing approach that can be replaced.
 * 
 * @param txXdr - Transaction XDR string
 * @param userAddress - User's wallet address
 * @param secretKey - User's secret key (in production, this comes from AA SDK)
 * @returns Signed transaction XDR
 */
export const signWithAAWallet = async (
  txXdr: string,
  userAddress: string,
  secretKey?: string
): Promise<string> => {
  logger.info('Signing transaction with AA wallet', {
    userAddress: userAddress.substring(0, 8) + '...',
  })

  try {
    // In production, this would use Hoblayerta SDK:
    // const signature = await aaWallet.signTransaction(txXdr)
    
    // For now, we'll use direct signing with secret key
    // TODO: Replace with Hoblayerta SDK integration
    if (!secretKey) {
      // Mock signing for development
      logger.warn('No secret key provided, using mock signing')
      return txXdr // Return unsigned XDR for mock
    }

    // Deserialize transaction
    const transaction = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE)
    
    // Sign with keypair
    const keypair = Keypair.fromSecret(secretKey)
    transaction.sign(keypair)

    // Return signed XDR
    const signedXdr = transaction.toXDR()
    
    logger.info('Transaction signed successfully')
    return signedXdr
  } catch (error: any) {
    logger.error('Failed to sign transaction', {
      error: error.message,
      userAddress: userAddress.substring(0, 8) + '...',
    })
    throw new Error(`Failed to sign transaction: ${error.message}`)
  }
}

/**
 * Submit transaction to Soroban and wait for confirmation
 * 
 * @param signedTxXdr - Signed transaction XDR
 * @returns Transaction result with hash and decoded output
 */
export const submitToSoroban = async (signedTxXdr: string): Promise<{
  transactionHash: string
  resultXdr: string
  decodedOutput?: any
}> => {
  const rpc = initSorobanClient()

  logger.info('Submitting transaction to Soroban')

  try {
    // 1. Deserialize signed transaction
    const transaction = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)

    // 2. Send transaction
    const sendResult = await rpc.sendTransaction(transaction)
    
    logger.info('Transaction sent', {
      hash: sendResult.hash,
      status: sendResult.status,
    })

    // 3. Wait for transaction to be ingested
    let txResult
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      try {
        txResult = await rpc.getTransaction(sendResult.hash)
        
        if (txResult.status === 'SUCCESS') {
          break
        } else if (txResult.status === 'FAILED') {
          throw new Error(`Transaction failed: ${txResult.resultXdr}`)
        }
      } catch (error: any) {
        // Transaction not yet confirmed, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
    }

    if (!txResult || txResult.status !== 'SUCCESS') {
      throw new Error('Transaction confirmation timeout')
    }

    // 4. Decode result
    let decodedOutput: any = null
    try {
      if (txResult.resultXdr) {
        const resultVal = xdr.ScVal.fromXDR(txResult.resultXdr)
        decodedOutput = decodeScVal(resultVal)
      }
    } catch (error) {
      logger.warn('Failed to decode result', { error })
    }

    logger.info('Transaction confirmed', {
      hash: sendResult.hash,
      status: txResult.status,
    })

    return {
      transactionHash: sendResult.hash,
      resultXdr: txResult.resultXdr || '',
      decodedOutput,
    }
  } catch (error: any) {
    logger.error('Failed to submit transaction', {
      error: error.message,
      stack: error.stack,
    })
    throw new Error(`Failed to submit transaction: ${error.message}`)
  }
}

/**
 * Decode ScVal to JavaScript value
 */
const decodeScVal = (scVal: xdr.ScVal): any => {
  switch (scVal.switch()) {
    case xdr.ScValType.scvBool():
      return scVal.b()
    case xdr.ScValType.scvI32():
      return scVal.i32()
    case xdr.ScValType.scvI64():
      return scVal.i64().toString()
    case xdr.ScValType.scvI128():
      const i128 = scVal.i128()
      return i128.hi().toString() + i128.lo().toString()
    case xdr.ScValType.scvU32():
      return scVal.u32()
    case xdr.ScValType.scvU64():
      return scVal.u64().toString()
    case xdr.ScValType.scvBytes():
      return scVal.bytes().toString('hex')
    case xdr.ScValType.scvString():
      return scVal.str().toString()
    case xdr.ScValType.scvAddress():
      return scVal.address().toString()
    case xdr.ScValType.scvVec():
      return scVal.vec()?.map((v) => decodeScVal(v)) || []
    case xdr.ScValType.scvMap():
      const map: Record<string, any> = {}
      scVal.map()?.forEach((entry) => {
        const key = decodeScVal(entry.key())
        const val = decodeScVal(entry.val())
        map[String(key)] = val
      })
      return map
    default:
      return scVal.toString()
  }
}

/**
 * Convert Address string to Address ScVal
 */
const addressToScVal = (address: string): xdr.ScVal => {
  try {
    const keypair = Keypair.fromPublicKey(address)
    const accountId = xdr.PublicKey.publicKeyTypeEd25519(keypair.rawPublicKey())
    const scAddress = xdr.ScAddress.scAddressTypeAccount(accountId)
    return xdr.ScVal.scvAddress(scAddress)
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`)
  }
}

/**
 * Error types for Soroban operations
 */
export class SorobanError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'SorobanError'
  }
}

/**
 * Handle Soroban errors and return readable messages
 */
export const handleSorobanError = (error: any): SorobanError => {
  if (error.message?.includes('insufficient')) {
    return new SorobanError(
      'Insufficient funds for transaction',
      'INSUFFICIENT_FUNDS',
      402
    )
  }

  if (error.message?.includes('simulation')) {
    return new SorobanError(
      'Transaction simulation failed',
      'SIMULATION_ERROR',
      400
    )
  }

  if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
    return new SorobanError(
      'Invalid transaction parameters',
      'INVALID_PARAMS',
      400
    )
  }

  if (error.message?.includes('duplicate') || error.message?.includes('Duplicate')) {
    return new SorobanError(
      'Duplicate transaction or data',
      'DUPLICATE',
      409
    )
  }

  if (error.message?.includes('timeout')) {
    return new SorobanError(
      'Transaction confirmation timeout',
      'TIMEOUT',
      504
    )
  }

  // Default error
  return new SorobanError(
    error.message || 'Unknown Soroban error',
    'SOROBAN_ERROR',
    500
  )
}

