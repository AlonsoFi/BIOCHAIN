/**
 * ZK-Prover Module
 * 
 * Generates Zero-Knowledge Proofs for BioChain study validation.
 * 
 * Architecture:
 * - Input: dataset_hash + attestation_proof (from NVIDIA TEE)
 * - Output: zk_proof (verifiable without revealing content)
 * 
 * Future Integration:
 * - BN254 precompile (Protocol 24 compatibility)
 * - RISC Zero verifier
 * - Real ZK circuit implementation
 */

export { generateZKProof, verifyZKProof } from './prover.js'
export type { ZKProof, ZKProofInputs } from './types.js'

