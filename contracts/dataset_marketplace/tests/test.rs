#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, Env, String as SorobanString, Vec, I128, Address};

#[test]
fn test_register_dataset() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DatasetMarketplace);
    
    let dataset_id = SorobanString::from_str(&env, "dataset_1");
    let study_ids = Vec::from_array(&env, [
        SorobanString::from_str(&env, "study_1"),
        SorobanString::from_str(&env, "study_2"),
    ]);
    let price = I128::from(10000); // 100.00 USDC (2 decimales)

    let result = contract_id.register_dataset(&dataset_id, &study_ids, &price);
    assert!(result.is_ok());

    // Verificar que se puede obtener
    let dataset = contract_id.get_dataset(&dataset_id);
    assert!(dataset.is_ok());
}

