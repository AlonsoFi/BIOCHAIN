#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Env, Symbol, Map, Address, 
    String as SorobanString, Bytes, BytesN
};

const STUDY_RECORD: Symbol = symbol_short!("STUDY_REC");
const DATASET_HASHES: Symbol = symbol_short!("DATASET_H");

#[contract]
pub struct StudyRegistry;

#[contractimpl]
impl StudyRegistry {
    /// Registra un estudio médico
    /// 
    /// Valida:
    /// - ZK proof: Verifica que el estudio es válido sin revelar contenido
    /// - Attestation: Verifica que fue procesado en NVIDIA TEE
    /// - Uniqueness: Verifica que dataset_hash no existe (anti-duplicado)
    /// 
    /// IMPORTANTE:
    /// - NO incluye cycle_timestamp (regla de "uno por mes" eliminada)
    /// - NO incluye contributor_id en validación ZK
    /// - NO almacena PII
    /// - Solo almacena: study_id, dataset_hash, contributor_address
    /// 
    /// Parámetros:
    /// - dataset_hash: Hash del dataset procesado (BytesN<32>)
    /// - attestation: Attestation proof del CVM (NVIDIA TEE)
    /// - zk_proof: Zero-Knowledge proof del estudio
    /// - contributor: Dirección del contribuyente (Address)
    /// 
    /// Retorna: study_id único
    pub fn register_study(
        env: Env,
        dataset_hash: BytesN<32>,
        attestation: Bytes,
        zk_proof: Bytes,
        contributor: Address,
    ) -> Result<SorobanString, SorobanString> {
        // ============================================
        // 1. VERIFICAR UNIQUENESS (Anti-duplicado)
        // ============================================
        if Self::dataset_exists(&env, &dataset_hash) {
            return Err(SorobanString::from_str(&env, "Duplicate study: dataset_hash already registered"));
        }

        // ============================================
        // 2. VERIFICAR ATTESTATION (TEE Proof)
        // ============================================
        // TODO: En producción, verificaría la attestation del TEE
        // Por ahora, mock: verificar que attestation no está vacío
        if attestation.len() == 0 {
            return Err(SorobanString::from_str(&env, "Invalid attestation: empty"));
        }

        // ============================================
        // 3. VERIFICAR ZK PROOF
        // ============================================
        // TODO: En producción, verificaría la proof con RISC Zero verifier
        // Por ahora, mock: verificar que zk_proof no está vacío
        if zk_proof.len() == 0 {
            return Err(SorobanString::from_str(&env, "Invalid ZK proof: empty"));
        }

        // Mock verification: En producción usaría RISC Zero verifier
        // verify_zk_proof(zk_proof, dataset_hash, attestation)
        if !Self::verify_zk_proof_mock(&env, &zk_proof, &dataset_hash, &attestation) {
            return Err(SorobanString::from_str(&env, "ZK proof verification failed"));
        }

        // ============================================
        // 4. GENERAR study_id ÚNICO
        // ============================================
        // study_id = hash(dataset_hash + contributor + counter)
        let storage = env.storage().instance();
        let counter: u64 = storage.get(&symbol_short!("counter")).unwrap_or(0u64);
        counter += 1;
        storage.set(&symbol_short!("counter"), &counter);

        let study_id = SorobanString::from_str(&env, &format!("study_{}", counter));

        // ============================================
        // 5. CREAR StudyRecord
        // ============================================
        // IMPORTANTE: Solo almacenamos:
        // - study_id
        // - dataset_hash
        // - contributor_address
        // NO timestamps, NO PII, NO metadata
        let study_record = (
            study_id.clone(),
            dataset_hash.clone(),
            contributor.clone(),
        );

        // Guardar estudio
        let mut studies: Map<SorobanString, (BytesN<32>, Address)> = 
            storage.get(&STUDY_RECORD).unwrap_or(Map::new(&env));
        studies.set(study_id.clone(), study_record);
        storage.set(&STUDY_RECORD, &studies);

        // ============================================
        // 6. REGISTRAR dataset_hash (para uniqueness check)
        // ============================================
        let mut dataset_hashes: Map<BytesN<32>, bool> = 
            storage.get(&DATASET_HASHES).unwrap_or(Map::new(&env));
        dataset_hashes.set(dataset_hash.clone(), true);
        storage.set(&DATASET_HASHES, &dataset_hashes);

        // ============================================
        // 7. EMITIR EVENTO
        // ============================================
        env.events().publish(
            (symbol_short!("study"), symbol_short!("registered")),
            (study_id.clone(), contributor, dataset_hash),
        );

        Ok(study_id)
    }

    /// Verifica si un dataset_hash ya existe (anti-duplicado)
    pub fn dataset_exists(env: &Env, dataset_hash: &BytesN<32>) -> bool {
        let storage = env.storage().instance();
        let dataset_hashes: Map<BytesN<32>, bool> = 
            storage.get(&DATASET_HASHES).unwrap_or(Map::new(env));
        dataset_hashes.get(dataset_hash.clone()).is_some()
    }

    /// Obtiene un estudio por ID
    pub fn get_study(
        env: Env,
        study_id: SorobanString,
    ) -> Result<(BytesN<32>, Address), SorobanString> {
        let storage = env.storage().instance();
        let studies: Map<SorobanString, (BytesN<32>, Address)> = 
            storage.get(&STUDY_RECORD).unwrap_or(Map::new(&env));
        
        studies.get(study_id.clone())
            .ok_or(SorobanString::from_str(&env, "Study not found"))
    }

    /// Verifica ZK proof (mock implementation)
    /// 
    /// TODO: En producción, usar RISC Zero verifier
    /// Verifica que:
    /// - La proof es válida
    /// - Los public inputs (dataset_hash, attestation) coinciden
    /// - La proof certifica procesamiento en TEE sin PII
    fn verify_zk_proof_mock(
        _env: &Env,
        zk_proof: &Bytes,
        dataset_hash: &BytesN<32>,
        attestation: &Bytes,
    ) -> bool {
        // Mock: Verificar estructura básica
        // En producción, esto sería:
        // 1. Deserializar la proof
        // 2. Verificar con RISC Zero verifier
        // 3. Validar public inputs (dataset_hash, attestation)
        // 4. Validar que la proof certifica:
        //    - Procesamiento en TEE
        //    - Sin PII
        //    - Hash válido
        
        zk_proof.len() > 0 && 
        dataset_hash.len() == 32 && 
        attestation.len() > 0
    }
}
