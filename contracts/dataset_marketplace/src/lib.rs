#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Map, Address, String as SorobanString, Vec, I128};

const DATASET: Symbol = symbol_short!("DATASET");
const PURCHASE: Symbol = symbol_short!("PURCHASE");

#[contract]
pub struct DatasetMarketplace;

#[derive(Clone)]
pub struct Dataset {
    pub dataset_id: SorobanString,
    pub study_ids: Vec<SorobanString>,
    pub price_usdc: I128,
    pub owner: Address,
}

#[derive(Clone)]
pub struct PurchaseRecord {
    pub dataset_id: SorobanString,
    pub buyer: Address,
    pub amount: I128,
    pub timestamp: u64,
}

#[contractimpl]
impl DatasetMarketplace {
    /// Registra un dataset en el marketplace
    pub fn register_dataset(
        env: Env,
        dataset_id: SorobanString,
        study_ids: Vec<SorobanString>,
        price_usdc: I128,
    ) -> Result<(), SorobanString> {
        let owner = env.invoker();
        
        let dataset = Dataset {
            dataset_id: dataset_id.clone(),
            study_ids: study_ids.clone(),
            price_usdc,
            owner: owner.clone(),
        };

        let storage = env.storage().instance();
        let mut datasets: Map<SorobanString, Dataset> = 
            storage.get(&DATASET).unwrap_or(Map::new(&env));
        
        datasets.set(dataset_id.clone(), dataset);
        storage.set(&DATASET, &datasets);

        // Emitir evento
        env.events().publish(
            (symbol_short!("dataset"), symbol_short!("registered")),
            (dataset_id, owner),
        );

        Ok(())
    }

    /// Compra un dataset
    /// 
    /// Flujo:
    /// 1. Verifica que el dataset existe
    /// 2. Verifica que el pago es correcto (debe ser llamado con pago USDC)
    /// 3. Llama a revenue_splitter para distribuir pagos
    /// 4. Crea PurchaseRecord
    pub fn purchase_dataset(
        env: Env,
        dataset_id: SorobanString,
        revenue_splitter: Address,
    ) -> Result<SorobanString, SorobanString> {
        let buyer = env.invoker();
        let storage = env.storage().instance();
        
        // Obtener dataset
        let datasets: Map<SorobanString, Dataset> = 
            storage.get(&DATASET).unwrap_or(Map::new(&env));
        
        let dataset = datasets.get(dataset_id.clone())
            .ok_or(SorobanString::from_str(&env, "Dataset not found"))?;

        // TODO: Verificar que se pasó el pago correcto en USDC
        // Por ahora, asumimos que el pago ya se hizo
        
        // TODO: Llamar a revenue_splitter para distribuir pagos
        // 85% a contributors, 15% a BioChain
        // En producción, se usaría:
        // let splitter_client = revenue_splitter::Client::new(&env, &revenue_splitter);
        // splitter_client.split_revenue(&dataset_id, &dataset.price_usdc, &dataset.study_ids);

        // Crear PurchaseRecord
        let purchase = PurchaseRecord {
            dataset_id: dataset_id.clone(),
            buyer: buyer.clone(),
            amount: dataset.price_usdc,
            timestamp: env.ledger().timestamp(),
        };

        let mut purchases: Map<SorobanString, PurchaseRecord> = 
            storage.get(&PURCHASE).unwrap_or(Map::new(&env));
        purchases.set(dataset_id.clone(), purchase);
        storage.set(&PURCHASE, &purchases);

        // Emitir evento
        env.events().publish(
            (symbol_short!("dataset"), symbol_short!("purchased")),
            (dataset_id.clone(), buyer, dataset.price_usdc),
        );

        Ok(dataset_id)
    }

    /// Obtiene un dataset
    pub fn get_dataset(
        env: Env,
        dataset_id: SorobanString,
    ) -> Result<Dataset, SorobanString> {
        let storage = env.storage().instance();
        let datasets: Map<SorobanString, Dataset> = 
            storage.get(&DATASET).unwrap_or(Map::new(&env));
        
        datasets.get(dataset_id.clone())
            .ok_or(SorobanString::from_str(&env, "Dataset not found"))
    }
}

