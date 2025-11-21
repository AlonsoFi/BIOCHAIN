#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Address, String as SorobanString, Vec, I128};

const TREASURY: Symbol = symbol_short!("TREASURY");

#[contract]
pub struct RevenueSplitter;

#[contractimpl]
impl RevenueSplitter {
    /// Distribuye revenue de una compra de dataset
    /// 
    /// Distribución:
    /// - 85% a contributors (repartido igual entre study_ids)
    /// - 15% a BioChain treasury
    /// 
    /// Parámetros:
    /// - dataset_id: ID del dataset vendido
    /// - amount_usdc: Monto total en USDC
    /// - study_ids: Lista de study IDs que forman el dataset
    pub fn split_revenue(
        env: Env,
        dataset_id: SorobanString,
        amount_usdc: I128,
        study_ids: Vec<SorobanString>,
    ) -> Result<(), SorobanString> {
        // Calcular distribución
        // 85% a contributors
        let contributors_amount = amount_usdc * I128::from(85) / I128::from(100);
        
        // 15% a treasury
        let treasury_amount = amount_usdc * I128::from(15) / I128::from(100);

        // Obtener treasury address (configurado al deployar)
        let storage = env.storage().instance();
        let treasury: Address = storage.get(&TREASURY)
            .ok_or(SorobanString::from_str(&env, "Treasury not configured"))?;

        // Calcular monto por contributor
        let contributor_count = I128::from(study_ids.len() as i64);
        let amount_per_contributor = contributors_amount / contributor_count;

        // TODO: Obtener addresses de contributors desde study_registry
        // Por ahora, solo emitimos eventos
        
        // Emitir eventos para cada transfer
        for study_id in study_ids.iter() {
            env.events().publish(
                (symbol_short!("revenue"), symbol_short!("split")),
                (study_id.clone(), amount_per_contributor),
            );
        }

        // Emitir evento para treasury
        env.events().publish(
            (symbol_short!("revenue"), symbol_short!("treasury")),
            (treasury, treasury_amount),
        );

        // TODO: En producción, hacer transferencias reales de USDC
        // usando el contrato de token estándar de Stellar
        
        Ok(())
    }

    /// Configura la dirección del treasury
    pub fn set_treasury(
        env: Env,
        treasury: Address,
    ) -> Result<(), SorobanString> {
        let storage = env.storage().instance();
        storage.set(&TREASURY, &treasury);
        Ok(())
    }
}

