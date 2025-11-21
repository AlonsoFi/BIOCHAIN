#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, Env, String as SorobanString, Address, I64};

#[test]
fn test_register_study() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StudyRegistry);
    
    let contributor = Address::generate(&env);
    let zk_proof = SorobanString::from_str(&env, "zk_proof_123");
    let attestation = SorobanString::from_str(&env, "attestation_123");
    let dataset_hash = SorobanString::from_str(&env, "hash_123");
    let cycle_timestamp = I64::from(1234567890);

    // Registrar estudio
    let study_id = contract_id.register_study(
        &contributor,
        &zk_proof,
        &attestation,
        &dataset_hash,
        &cycle_timestamp,
    );

    assert!(study_id.is_ok());
    
    // Verificar que se puede obtener
    let study = contract_id.get_study(&study_id.unwrap());
    assert!(study.is_ok());
}

#[test]
fn test_duplicate_study_same_cycle() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StudyRegistry);
    
    let contributor = Address::generate(&env);
    let cycle_timestamp = I64::from(1234567890);

    // Primer estudio
    let study_id1 = contract_id.register_study(
        &contributor,
        &SorobanString::from_str(&env, "zk_proof_1"),
        &SorobanString::from_str(&env, "attestation_1"),
        &SorobanString::from_str(&env, "hash_1"),
        &cycle_timestamp,
    );
    assert!(study_id1.is_ok());

    // Intentar registrar otro estudio en el mismo ciclo (debe fallar)
    let study_id2 = contract_id.register_study(
        &contributor,
        &SorobanString::from_str(&env, "zk_proof_2"),
        &SorobanString::from_str(&env, "attestation_2"),
        &SorobanString::from_str(&env, "hash_2"),
        &cycle_timestamp,
    );
    assert!(study_id2.is_err());
}

