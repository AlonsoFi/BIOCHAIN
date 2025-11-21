#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, Env, String as SorobanString, Vec, I128, Address};

#[test]
fn test_split_revenue() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RevenueSplitter);
    
    // Configurar treasury
    let treasury = Address::generate(&env);
    contract_id.set_treasury(&treasury);

    let dataset_id = SorobanString::from_str(&env, "dataset_1");
    let amount = I128::from(10000); // 100.00 USDC
    let study_ids = Vec::from_array(&env, [
        SorobanString::from_str(&env, "study_1"),
        SorobanString::from_str(&env, "study_2"),
    ]);

    // Distribuir revenue
    let result = contract_id.split_revenue(&dataset_id, &amount, &study_ids);
    assert!(result.is_ok());
}

