/**
 * ZK Prover Service (DEPRECATED - Use zk-prover module instead)
 * 
 * @deprecated This file is kept for backward compatibility.
 * Use `backend/src/services/zk-prover/index.ts` instead.
 * 
 * This file re-exports from the new module structure.
 */

import { generateZKProof, verifyZKProof } from './zk-prover/index.js'
import type { ZKProof } from './zk-prover/types.js'

// Re-export for backward compatibility
export type { ZKProof }

// Wrapper functions for backward compatibility
export const generateProof = async (
  datasetHash: string,
  attestationProof: string
): Promise<ZKProof> => {
  return generateZKProof({
    datasetHash,
    attestationProof,
  })
}

export const verifyProof = async (zkProof: ZKProof): Promise<boolean> => {
  return verifyZKProof(zkProof.proof, zkProof.publicInputs)
}

