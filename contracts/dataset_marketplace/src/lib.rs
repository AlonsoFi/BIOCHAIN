#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Env, Symbol, Map, Address, 
    Bytes, BytesN, Vec, I128,
};

/// Storage keys
const DATASET_KEY: Symbol = symbol_short!("DATASET");
const PURCHASE_KEY: Symbol = symbol_short!("PURCHASE");
const REVENUE_SPLITTER_KEY: Symbol = symbol_short!("REV_SPLIT");
const STUDY_REGISTRY_KEY: Symbol = symbol_short!("STUDY_REG");

/// Dataset structure
/// 
/// Stores dataset information on-chain:
/// - dataset_id: Unique identifier for the dataset (Bytes)
/// - study_ids: List of study hashes included in this dataset
/// - price_usdc: Price in USDC (i128, with 7 decimal places for Stellar)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dataset {
    pub dataset_id: Bytes,
    pub study_ids: Vec<Bytes>,
    pub price_usdc: I128,
}

/// PurchaseRecord structure
/// 
/// Stores purchase information:
/// - buyer: Address of the researcher who purchased
/// - dataset_id: ID of the purchased dataset
/// - tx_hash: Transaction hash of the purchase
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PurchaseRecord {
    pub buyer: Address,
    pub dataset_id: Bytes,
    pub tx_hash: Bytes,
}

/// Error types for the contract
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    DatasetNotFound,
    DatasetAlreadyExists,
    InvalidPrice,
    PaymentFailed,
    InvalidStudyIds,
    RevenueSplitterNotSet,
    StudyRegistryNotSet,
    ContributorLookupFailed,
}

/// Event data for DatasetRegistered event
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DatasetRegisteredEventData {
    pub dataset_id: Bytes,
    pub price_usdc: I128,
    pub study_count: u32,
}

/// Event data for DatasetPurchased event
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DatasetPurchasedEventData {
    pub buyer: Address,
    pub dataset_id: Bytes,
    pub price_usdc: I128,
}

#[contract]
pub struct DatasetMarketplace;

#[contractimpl]
impl DatasetMarketplace {
    /// Register a dataset in the marketplace
    /// 
    /// This function allows dataset owners to register their datasets for sale.
    /// 
    /// Requirements:
    /// - dataset_id must be unique (not already registered)
    /// - study_ids must not be empty
    /// - price_usdc must be positive
    /// 
    /// Storage:
    /// - Key: ("DATASET", dataset_id)
    /// - Value: Dataset { dataset_id, study_ids, price_usdc }
    /// 
    /// Events:
    /// - Emits DatasetRegistered event
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - Unique identifier for the dataset (Bytes)
    /// * `study_ids` - Vector of study hashes (Vec<Bytes>)
    /// * `price_usdc` - Price in USDC (i128, 7 decimal places)
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    /// * `Err(Error)` if validation fails
    pub fn register_dataset(
        env: Env,
        dataset_id: Bytes,
        study_ids: Vec<Bytes>,
        price_usdc: I128,
    ) -> Result<(), Error> {
        // ============================================
        // 1. VALIDATE INPUTS
        // ============================================
        
        // Check that dataset_id is not empty
        if dataset_id.len() == 0 {
            return Err(Error::DatasetNotFound);
        }
        
        // Check that study_ids is not empty
        if study_ids.len() == 0 {
            return Err(Error::InvalidStudyIds);
        }
        
        // Check that price is positive
        if price_usdc <= I128::from(0) {
            return Err(Error::InvalidPrice);
        }
        
        // ============================================
        // 2. CHECK UNIQUENESS (Prevent duplicates)
        // ============================================
        let storage = env.storage().instance();
        let storage_key = (DATASET_KEY, dataset_id.clone());
        
        if storage.has(&storage_key) {
            return Err(Error::DatasetAlreadyExists);
        }
        
        // ============================================
        // 3. CREATE AND STORE DATASET
        // ============================================
        let dataset = Dataset {
            dataset_id: dataset_id.clone(),
            study_ids: study_ids.clone(),
            price_usdc,
        };
        
        storage.set(&storage_key, &dataset);
        
        // ============================================
        // 4. EMIT EVENT
        // ============================================
        env.events().publish(
            (symbol_short!("DatasetRegistered"), dataset_id.clone()),
            DatasetRegisteredEventData {
                dataset_id: dataset_id.clone(),
                price_usdc,
                study_count: study_ids.len() as u32,
            },
        );
        
        Ok(())
    }

    /// Purchase a dataset
    /// 
    /// This function allows researchers to purchase access to a dataset.
    /// 
    /// Flow:
    /// 1. Verify dataset exists
    /// 2. Verify payment (mock or real USDC token contract)
    /// 3. Store PurchaseRecord
    /// 4. Emit DatasetPurchased event
    /// 
    /// Payment:
    /// - In production, this would use Soroban token interface
    /// - For now, we use mock payment verification
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the dataset to purchase
    /// * `buyer` - Address of the researcher purchasing
    /// 
    /// # Returns
    /// * `Ok(Dataset)` if successful (returns dataset info for RevenueSplitter)
    /// * `Err(Error)` if validation fails
    pub fn purchase_dataset(
        env: Env,
        dataset_id: Bytes,
        buyer: Address,
    ) -> Result<Dataset, Error> {
        // ============================================
        // 1. LOAD DATASET
        // ============================================
        let storage = env.storage().instance();
        let storage_key = (DATASET_KEY, dataset_id.clone());
        
        let dataset: Dataset = storage.get(&storage_key)
            .ok_or(Error::DatasetNotFound)?;
        
        // ============================================
        // 2. VERIFY PAYMENT
        // ============================================
        // In production, this would:
        // 1. Get USDC token contract address from storage or env
        // 2. Verify buyer has authorized payment
        // 3. Transfer USDC from buyer to contract
        // 4. Verify transfer succeeded
        
        // Mock payment verification for now
        // TODO: Replace with real USDC token contract integration
        if !Self::verify_payment_mock(&env, &buyer, &dataset.price_usdc) {
            return Err(Error::PaymentFailed);
        }
        
        // ============================================
        // 3. CHECK IF ALREADY PURCHASED
        // ============================================
        // Optional: Check if buyer already purchased this dataset
        // For now, we allow multiple purchases (could be useful for analytics)
        
        // ============================================
        // 4. CREATE PURCHASE RECORD
        // ============================================
        let timestamp = env.ledger().timestamp();
        let tx_hash = Self::generate_tx_hash(&env, &dataset_id, &buyer, timestamp);
        
        let purchase = PurchaseRecord {
            buyer: buyer.clone(),
            dataset_id: dataset_id.clone(),
            tx_hash: tx_hash.clone(),
        };
        
        // Store purchase record
        // Key: ("PURCHASE", dataset_id, buyer_address)
        let purchase_key = (PURCHASE_KEY, dataset_id.clone(), buyer.clone());
        storage.set(&purchase_key, &purchase);
        
        // ============================================
        // 5. CALL REVENUE SPLITTER
        // ============================================
        // Get contributor addresses from StudyRegistry
        let contributors = Self::get_contributors_from_studies(&env, &dataset.study_ids)?;
        
        // Call RevenueSplitter to distribute payouts
        if contributors.len() > 0 {
            let revenue_splitter: Address = storage.get(&REVENUE_SPLITTER_KEY)
                .ok_or(Error::RevenueSplitterNotSet)?;
            
            // Call RevenueSplitter.payout_for_dataset()
            // Using invoke_contract with proper Soroban SDK syntax
            let _: Result<(), ()> = env.invoke_contract(
                &revenue_splitter,
                &symbol_short!("payout_for_dataset"),
                soroban_sdk::vec![&env, 
                    dataset_id.clone(),
                    contributors.clone(),
                ],
            );
            
            // Note: If the call fails, the entire transaction will revert
            // This ensures atomicity: purchase only succeeds if payouts succeed
        }
        
        // ============================================
        // 6. EMIT EVENT
        // ============================================
        env.events().publish(
            (symbol_short!("DatasetPurchased"), dataset_id.clone()),
            DatasetPurchasedEventData {
                buyer: buyer.clone(),
                dataset_id: dataset_id.clone(),
                price_usdc: dataset.price_usdc,
            },
        );
        
        Ok(dataset)
    }

    /// Get a dataset by ID
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the dataset to retrieve
    /// 
    /// # Returns
    /// * `Ok(Dataset)` if found
    /// * `Err(Error::DatasetNotFound)` if not found
    pub fn get_dataset(
        env: Env,
        dataset_id: Bytes,
    ) -> Result<Dataset, Error> {
        let storage = env.storage().instance();
        let storage_key = (DATASET_KEY, dataset_id);
        
        storage.get(&storage_key)
            .ok_or(Error::DatasetNotFound)
    }

    /// Check if a dataset exists
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the dataset to check
    /// 
    /// # Returns
    /// * `true` if dataset exists, `false` otherwise
    pub fn dataset_exists(
        env: &Env,
        dataset_id: &Bytes,
    ) -> bool {
        let storage = env.storage().instance();
        let storage_key = (DATASET_KEY, dataset_id.clone());
        storage.has(&storage_key)
    }

    /// Get purchase record for a buyer and dataset
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the dataset
    /// * `buyer` - Address of the buyer
    /// 
    /// # Returns
    /// * `Ok(PurchaseRecord)` if found
    /// * `Err(Error::DatasetNotFound)` if not found
    pub fn get_purchase(
        env: Env,
        dataset_id: Bytes,
        buyer: Address,
    ) -> Result<PurchaseRecord, Error> {
        let storage = env.storage().instance();
        let purchase_key = (PURCHASE_KEY, dataset_id, buyer);
        
        storage.get(&purchase_key)
            .ok_or(Error::DatasetNotFound)
    }

    /// Verify payment (mock implementation)
    /// 
    /// In production, this would:
    /// 1. Get USDC token contract address
    /// 2. Check buyer's balance
    /// 3. Verify buyer has authorized payment
    /// 4. Transfer USDC from buyer to contract
    /// 5. Verify transfer succeeded
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `buyer` - Address of the buyer
    /// * `amount` - Amount to verify
    /// 
    /// # Returns
    /// * `true` if payment is valid (mock: always true for now)
    /// * `false` otherwise
    fn verify_payment_mock(
        env: &Env,
        buyer: &Address,
        amount: &I128,
    ) -> bool {
        // Mock verification: In production, this would:
        // 1. Get USDC token contract
        // 2. Check balance
        // 3. Transfer funds
        // 4. Verify success
        
        // For now, just check that amount is positive
        *amount > I128::from(0)
    }

    /// Set the RevenueSplitter contract address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `revenue_splitter` - Address of the RevenueSplitter contract
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    pub fn set_revenue_splitter(
        env: Env,
        revenue_splitter: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        storage.set(&REVENUE_SPLITTER_KEY, &revenue_splitter);
        Ok(())
    }

    /// Set the StudyRegistry contract address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `study_registry` - Address of the StudyRegistry contract
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    pub fn set_study_registry(
        env: Env,
        study_registry: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        storage.set(&STUDY_REGISTRY_KEY, &study_registry);
        Ok(())
    }

    /// Get contributor addresses from study IDs
    /// 
    /// This function queries the StudyRegistry contract to get the contributor
    /// address for each study hash in the dataset.
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `study_ids` - Vector of study hashes (Bytes)
    /// 
    /// # Returns
    /// * `Ok(Vec<Address>)` with contributor addresses
    /// * `Err(Error)` if lookup fails
    fn get_contributors_from_studies(
        env: &Env,
        study_ids: &Vec<Bytes>,
    ) -> Result<Vec<Address>, Error> {
        let storage = env.storage().instance();
        let study_registry: Address = storage.get(&STUDY_REGISTRY_KEY)
            .ok_or(Error::StudyRegistryNotSet)?;
        
        let mut contributors = Vec::new(env);
        
        for study_id in study_ids.iter() {
            // Convert Bytes to BytesN<32> for StudyRegistry lookup
            // Note: This assumes study_id is exactly 32 bytes (SHA256 hash)
            if study_id.len() != 32 {
                // Skip invalid study IDs (could also return error)
                continue;
            }
            
            // Create BytesN<32> from Bytes
            let mut hash_bytes = [0u8; 32];
            for i in 0..32 {
                hash_bytes[i] = study_id.get(i).unwrap_or(0);
            }
            let study_hash = BytesN::from_array(env, &hash_bytes);
            
            // Call StudyRegistry.get_study() to get contributor address
            // Returns: (dataset_hash: BytesN<32>, contributor: Address, timestamp: u64)
            let study_result: Result<(BytesN<32>, Address, u64), ()> = env.invoke_contract(
                &study_registry,
                &symbol_short!("get_study"),
                soroban_sdk::vec![env, study_hash],
            );
            
            match study_result {
                Ok((_, contributor, _)) => {
                    contributors.push_back(contributor);
                },
                Err(_) => {
                    // If study not found, skip it
                    // This allows datasets with some studies not yet registered
                    continue;
                }
            }
        }
        
        // Return contributors (can be empty if no studies found)
        Ok(contributors)
    }

    /// Generate a transaction hash for purchase record
    /// 
    /// In production, this would use the actual transaction hash from the ledger.
    /// For now, we generate a mock hash based on dataset_id, buyer, and timestamp.
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the dataset
    /// * `buyer` - Address of the buyer
    /// * `timestamp` - Ledger timestamp
    /// 
    /// # Returns
    /// * `Bytes` representing the transaction hash
    fn generate_tx_hash(
        env: &Env,
        dataset_id: &Bytes,
        buyer: &Address,
        timestamp: u64,
    ) -> Bytes {
        // Mock hash generation
        // In production, this would use env.ledger().sequence() or actual tx hash
        // For now, we create a simple mock hash by combining the inputs
        let mut hash_input = Bytes::new(env);
        hash_input.append(dataset_id);
        
        // Append timestamp as bytes
        let timestamp_bytes = Bytes::from_slice(env, &timestamp.to_be_bytes());
        hash_input.append(&timestamp_bytes);
        
        // Append a simple identifier for buyer (in production, use proper address serialization)
        let buyer_id = Bytes::from_slice(env, b"buyer");
        hash_input.append(&buyer_id);
        
        // Return the combined bytes as mock hash
        // In production, this would be a proper cryptographic hash (SHA256) of the transaction
        hash_input
    }
}
