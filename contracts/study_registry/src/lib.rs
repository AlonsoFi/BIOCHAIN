#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Map, Address, String as SorobanString, I64};

const STUDY_RECORD: Symbol = symbol_short!("STUDY_REC");

#[contract]
pub struct StudyRegistry;

#[contractimpl]
impl StudyRegistry {
    /// Registra un estudio médico
    /// 
    /// Según diagrama, Soroban valida:
    /// - ZK proof: Verifica que el estudio es válido sin revelar contenido
    /// - Attestation: Verifica que fue procesado en NVIDIA TEE
    /// - No duplicates: Enforce 1 upload por ciclo por contributor
    /// 
    /// Parámetros:
    /// - zk_proof: Zero-Knowledge proof del estudio
    /// - attestation: Attestation proof del CVM (NVIDIA TEE)
    /// - dataset_hash: Hash del dataset procesado
    /// - cycle_timestamp: Timestamp del ciclo (para enforce 1 upload por ciclo)
    /// 
    /// Enforce: 1 upload por ciclo por contributor
    pub fn register_study(
        env: Env,
        contributor: Address,
        zk_proof: SorobanString,
        attestation: SorobanString,
        dataset_hash: SorobanString,
        cycle_timestamp: I64,
    ) -> Result<SorobanString, SorobanString> {
        // ============================================
        // SOROBAN VALIDA (según diagrama):
        // ============================================
        
        // 1. Validar ZK proof
        // TODO: En producción, verificaría la proof con RISC Zero verifier
        // Por ahora, mock: verificar que zk_proof no está vacío
        if zk_proof.len() == 0 {
            return Err(SorobanString::from_str(&env, "ZK proof inválido"));
        }
        
        // 2. Validar Attestation
        // TODO: En producción, verificaría la attestation del TEE
        // Por ahora, mock: verificar que attestation no está vacío
        if attestation.len() == 0 {
            return Err(SorobanString::from_str(&env, "Attestation inválido"));
        }
        
        // 3. Validar No duplicates (enforce 1 upload por ciclo)
        
        // Generar study_id único
        let study_id = SorobanString::from_str(&env, &format!("study_{}_{}", 
            contributor.to_string(), 
            cycle_timestamp.to_i64()
        ));

        // Verificar que no haya duplicados en este ciclo
        let cycle_key = (contributor.clone(), cycle_timestamp);
        let storage = env.storage().instance();
        
        if storage.has(&cycle_key) {
            return Err(SorobanString::from_str(&env, "Ya existe un estudio para este ciclo"));
        }

        // Crear StudyRecord
        let study_record = (
            study_id.clone(),
            dataset_hash.clone(),
            contributor.clone(),
            cycle_timestamp,
        );

        // Guardar estudio
        let mut studies: Map<SorobanString, (SorobanString, Address, I64)> = 
            storage.get(&STUDY_RECORD).unwrap_or(Map::new(&env));
        studies.set(study_id.clone(), study_record);
        storage.set(&STUDY_RECORD, &studies);

        // Marcar ciclo como usado
        storage.set(&cycle_key, &true);

        // Emitir evento
        env.events().publish(
            (symbol_short!("study"), symbol_short!("registered")),
            (study_id.clone(), contributor, dataset_hash),
        );

        Ok(study_id)
    }

    /// Obtiene un estudio por ID
    pub fn get_study(
        env: Env,
        study_id: SorobanString,
    ) -> Result<(SorobanString, Address, I64), SorobanString> {
        let storage = env.storage().instance();
        let studies: Map<SorobanString, (SorobanString, Address, I64)> = 
            storage.get(&STUDY_RECORD).unwrap_or(Map::new(&env));
        
        studies.get(study_id.clone())
            .ok_or(SorobanString::from_str(&env, "Study not found"))
    }
}

