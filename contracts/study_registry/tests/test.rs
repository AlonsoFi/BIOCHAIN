#![cfg(test)]

use super::*;
use soroban_sdk::{
    Env, Address, Bytes, BytesN, testutils::{Address as AddressTestUtils, Events as EventsTestUtils},
};

/// Helper: Create a test environment
fn create_env() -> Env {
    Env::default()
}

/// Helper: Create a test address
fn create_address(env: &Env) -> Address {
    Address::generate(env)
}

/// Helper: Create a test dataset hash
fn create_dataset_hash(env: &Env, seed: u8) -> BytesN<32> {
    let mut hash_bytes = [seed; 32];
    hash_bytes[0] = seed;
    BytesN::from_array(env, &hash_bytes)
}

/// Helper: Create a test attestation
fn create_attestation(env: &Env) -> Bytes {
    Bytes::from_slice(env, b"mock_attestation_proof_from_tee")
}

/// Helper: Create a test ZK proof
fn create_zk_proof(env: &Env) -> Bytes {
    Bytes::from_slice(env, b"mock_zk_proof_bn254_1234567890")
}

/// Helper: Create StudyRegistry client
fn create_study_registry_client(env: &Env) -> StudyRegistryClient {
    let contract_id = env.register_contract(None, StudyRegistry);
    StudyRegistryClient::new(env, &contract_id)
}

#[test]
fn test_register_study_success() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor = create_address(&env);
    let dataset_hash = create_dataset_hash(&env, 0);
    let attestation = create_attestation(&env);
    let zk_proof = create_zk_proof(&env);
    
    // Act
    let result = client.register_study(
        &dataset_hash,
        &attestation,
        &zk_proof,
        &contributor,
    );
    
    // Assert
    assert!(result.is_ok(), "register_study should succeed");
    
    // Verify StudyRecord is stored
    let study = client.get_study(&dataset_hash);
    assert!(study.is_ok(), "get_study should succeed");
    
    let study_record = study.unwrap();
    assert_eq!(study_record.dataset_hash, dataset_hash, "dataset_hash should match");
    assert_eq!(study_record.contributor, contributor, "contributor should match");
    assert!(study_record.timestamp > 0, "timestamp should be set");
    
    // Verify StudyRegistered event was emitted
    let events = env.events().all();
    assert!(events.len() > 0, "Events should be emitted");
}

#[test]
fn test_register_study_duplicate_hash_fails() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor1 = create_address(&env);
    let contributor2 = create_address(&env);
    let dataset_hash = create_dataset_hash(&env, 1);
    let attestation = create_attestation(&env);
    let zk_proof = create_zk_proof(&env);
    
    // Act: Register first study
    let result1 = client.register_study(
        &dataset_hash,
        &attestation,
        &zk_proof,
        &contributor1,
    );
    assert!(result1.is_ok(), "First registration should succeed");
    
    // Act: Try to register duplicate
    let result2 = client.register_study(
        &dataset_hash,
        &attestation,
        &zk_proof,
        &contributor2,
    );
    
    // Assert: Should fail with DuplicateStudy error
    assert!(result2.is_err(), "Duplicate registration should fail");
    match result2.unwrap_err() {
        Error::DuplicateStudy => {},
        _ => panic!("Expected DuplicateStudy error"),
    }
    
    // Verify only one study record exists
    let study = client.get_study(&dataset_hash);
    assert!(study.is_ok());
    assert_eq!(study.unwrap().contributor, contributor1, "Original contributor should be preserved");
}

#[test]
fn test_register_study_invalid_attestation_fails() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor = create_address(&env);
    let dataset_hash = create_dataset_hash(&env, 2);
    let empty_attestation = Bytes::new(&env); // Empty attestation
    let zk_proof = create_zk_proof(&env);
    
    // Act
    let result = client.register_study(
        &dataset_hash,
        &empty_attestation,
        &zk_proof,
        &contributor,
    );
    
    // Assert
    assert!(result.is_err(), "Empty attestation should fail");
    match result.unwrap_err() {
        Error::InvalidAttestation => {},
        _ => panic!("Expected InvalidAttestation error"),
    }
    
    // Verify study was not stored
    let study = client.get_study(&dataset_hash);
    assert!(study.is_err(), "Study should not be stored");
}

#[test]
fn test_register_study_invalid_zk_proof_fails() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor = create_address(&env);
    let dataset_hash = create_dataset_hash(&env, 3);
    let attestation = create_attestation(&env);
    let empty_zk_proof = Bytes::new(&env); // Empty ZK proof
    
    // Act
    let result = client.register_study(
        &dataset_hash,
        &attestation,
        &empty_zk_proof,
        &contributor,
    );
    
    // Assert
    assert!(result.is_err(), "Empty ZK proof should fail");
    match result.unwrap_err() {
        Error::InvalidZKProof => {},
        _ => panic!("Expected InvalidZKProof error"),
    }
    
    // Verify study was not stored
    let study = client.get_study(&dataset_hash);
    assert!(study.is_err(), "Study should not be stored");
}

#[test]
fn test_get_nonexistent_study() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let nonexistent_hash = create_dataset_hash(&env, 99);
    
    // Act
    let result = client.get_study(&nonexistent_hash);
    
    // Assert
    assert!(result.is_err(), "Getting nonexistent study should fail");
    match result.unwrap_err() {
        Error::StudyNotFound => {},
        _ => panic!("Expected StudyNotFound error"),
    }
}

#[test]
fn test_dataset_exists() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor = create_address(&env);
    let dataset_hash = create_dataset_hash(&env, 4);
    let attestation = create_attestation(&env);
    let zk_proof = create_zk_proof(&env);
    
    // Before registration, dataset should not exist
    let exists_before = client.dataset_exists(&dataset_hash);
    assert!(!exists_before, "Dataset should not exist before registration");
    
    // Register study
    let result = client.register_study(
        &dataset_hash,
        &attestation,
        &zk_proof,
        &contributor,
    );
    assert!(result.is_ok(), "Registration should succeed");
    
    // After registration, dataset should exist
    let exists_after = client.dataset_exists(&dataset_hash);
    assert!(exists_after, "Dataset should exist after registration");
}

#[test]
fn test_multiple_studies_different_hashes() {
    let env = create_env();
    let client = create_study_registry_client(&env);
    
    // Arrange
    let contributor = create_address(&env);
    let attestation = create_attestation(&env);
    let zk_proof = create_zk_proof(&env);
    
    // Register multiple studies with different hashes
    for i in 0..5 {
        let dataset_hash = create_dataset_hash(&env, i + 10);
        let result = client.register_study(
            &dataset_hash,
            &attestation,
            &zk_proof,
            &contributor,
        );
        assert!(result.is_ok(), "Registration {} should succeed", i);
        
        // Verify each study exists
        let exists = client.dataset_exists(&dataset_hash);
        assert!(exists, "Dataset {} should exist", i);
    }
}
