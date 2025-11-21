/**
 * Type definitions for ZK-Prover module
 */

/**
 * Inputs to the ZK-Prover
 * 
 * IMPORTANT: Only dataset_hash and attestation_proof are used.
 * NO contributor_id, NO timestamps, NO PII, NO metadata.
 */
export interface ZKProofInputs {
  /** Hash del dataset procesado en NVIDIA TEE */
  datasetHash: string
  
  /** Attestation proof del TEE que certifica procesamiento seguro */
  attestationProof: string
}

/**
 * Output of ZK-Prover
 */
export interface ZKProof {
  /** La proof generada (string serializado) */
  proof: string
  
  /** Public inputs que se revelan (para verificación) */
  publicInputs: string[]
  
  /** Verification key (para verificar la proof) */
  verificationKey?: string
}

/**
 * ZK Circuit configuration
 * 
 * Preparado para integración futura con:
 * - BN254 curve (Protocol 24)
 * - RISC Zero verifier
 */
export interface ZKCircuitConfig {
  /** Curve type (BN254, BLS12-381, etc.) */
  curve?: 'BN254' | 'BLS12-381'
  
  /** Verifier type (RISC Zero, custom, etc.) */
  verifier?: 'RISC_ZERO' | 'CUSTOM'
  
  /** Circuit parameters */
  circuitParams?: Record<string, any>
}

