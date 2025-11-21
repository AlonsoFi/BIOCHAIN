#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, 
    Bytes, Vec, I128, token,
};

/// Storage keys
const USDC_TOKEN_KEY: Symbol = symbol_short!("USDC_TKN");
const TREASURY_KEY: Symbol = symbol_short!("TREASURY");

/// Base reward per contributor per purchase
/// 10 USDC with 7 decimal places (Stellar standard)
const BASE_REWARD: I128 = I128::from(10_0000000);

/// Contributor split percentage (85%)
const CONTRIBUTOR_PERCENT: I128 = I128::from(85);

/// Platform split percentage (15%)
const PLATFORM_PERCENT: I128 = I128::from(15);

/// Event data for ContributorRewarded event
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContributorRewarded {
    pub dataset_id: Bytes,
    pub contributor: Address,
    pub user_amount: I128,
    pub platform_amount: I128,
}

/// Event data for DatasetPayoutCompleted event
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DatasetPayoutCompleted {
    pub dataset_id: Bytes,
    pub num_contributors: u32,
    pub total_user_amount: I128,
    pub total_platform_amount: I128,
}

/// Error types for the contract
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInitialized,
    InvalidContributors,
    InvalidAmount,
    TransferFailed,
    TreasuryNotSet,
    TokenNotSet,
}

#[contract]
pub struct RevenueSplitter;

#[contractimpl]
impl RevenueSplitter {
    /// Initialize the RevenueSplitter contract
    /// 
    /// This function must be called once after deployment to configure:
    /// - USDC token contract address
    /// - BioChain treasury address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `usdc_token` - Address of the USDC token contract
    /// * `treasury` - Address of the BioChain treasury
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    /// * `Err(Error)` if initialization fails
    pub fn init(
        env: Env,
        usdc_token: Address,
        treasury: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        
        // Store USDC token address
        storage.set(&USDC_TOKEN_KEY, &usdc_token);
        
        // Store treasury address
        storage.set(&TREASURY_KEY, &treasury);
        
        Ok(())
    }

    /// Payout rewards for a dataset purchase
    /// 
    /// This function is called by DatasetMarketplace after a successful purchase.
    /// For each contributor in the dataset:
    /// - Calculates fixed reward of 10 USDC per contributor
    /// - Splits 85% to contributor, 15% to platform treasury
    /// - Transfers USDC tokens
    /// - Emits events for notifications
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `dataset_id` - ID of the purchased dataset
    /// * `contributors` - Vector of contributor addresses (one per study in dataset)
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    /// * `Err(Error)` if validation or transfer fails
    pub fn payout_for_dataset(
        env: Env,
        dataset_id: Bytes,
        contributors: Vec<Address>,
    ) -> Result<(), Error> {
        // ============================================
        // 1. VALIDATE INPUTS
        // ============================================
        
        if contributors.len() == 0 {
            return Err(Error::InvalidContributors);
        }
        
        // ============================================
        // 2. LOAD CONFIGURATION
        // ============================================
        let storage = env.storage().instance();
        
        let usdc_token: Address = storage.get(&USDC_TOKEN_KEY)
            .ok_or(Error::TokenNotSet)?;
        
        let treasury: Address = storage.get(&TREASURY_KEY)
            .ok_or(Error::TreasuryNotSet)?;
        
        // ============================================
        // 3. CALCULATE AMOUNTS
        // ============================================
        // Base reward: 10 USDC per contributor
        // Split: 85% contributor, 15% platform
        
        // Calculate user amount (85% of BASE_REWARD)
        let user_amount = (BASE_REWARD * CONTRIBUTOR_PERCENT) / I128::from(100);
        
        // Calculate platform amount (15% of BASE_REWARD)
        let platform_amount = BASE_REWARD - user_amount;
        
        // Validate amounts
        if user_amount <= I128::from(0) || platform_amount <= I128::from(0) {
            return Err(Error::InvalidAmount);
        }
        
        // ============================================
        // 4. INITIALIZE TOKEN CLIENT
        // ============================================
        let token_client = token::Client::new(&env, &usdc_token);
        let contract_address = env.current_contract_address();
        
        // ============================================
        // 5. PROCESS EACH CONTRIBUTOR
        // ============================================
        let mut total_user_amount = I128::from(0);
        let mut total_platform_amount = I128::from(0);
        
        for contributor in contributors.iter() {
            // Transfer user amount to contributor
            token_client.transfer(
                &contract_address,
                contributor,
                &user_amount,
            );
            
            // Transfer platform amount to treasury
            // Note: We transfer platform_amount for each contributor
            // This ensures proper accounting per contributor
            token_client.transfer(
                &contract_address,
                &treasury,
                &platform_amount,
            );
            
            // Accumulate totals
            total_user_amount = total_user_amount + user_amount;
            total_platform_amount = total_platform_amount + platform_amount;
            
            // ============================================
            // 6. EMIT PER-CONTRIBUTOR EVENT
            // ============================================
            env.events().publish(
                (
                    symbol_short!("ContributorRewarded"),
                    dataset_id.clone(),
                    contributor.clone(),
                ),
                ContributorRewarded {
                    dataset_id: dataset_id.clone(),
                    contributor: contributor.clone(),
                    user_amount,
                    platform_amount,
                },
            );
        }
        
        // ============================================
        // 7. EMIT AGGREGATE DATASET EVENT
        // ============================================
        env.events().publish(
            (
                symbol_short!("DatasetPayoutCompleted"),
                dataset_id.clone(),
            ),
            DatasetPayoutCompleted {
                dataset_id: dataset_id.clone(),
                num_contributors: contributors.len() as u32,
                total_user_amount,
                total_platform_amount,
            },
        );
        
        Ok(())
    }

    /// Get the configured USDC token address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// 
    /// # Returns
    /// * `Ok(Address)` if configured
    /// * `Err(Error::TokenNotSet)` if not initialized
    pub fn get_usdc_token(env: Env) -> Result<Address, Error> {
        let storage = env.storage().instance();
        storage.get(&USDC_TOKEN_KEY)
            .ok_or(Error::TokenNotSet)
    }

    /// Get the configured treasury address
    /// 
    /// # Arguments
    /// * `env` - The Soroban environment
    /// 
    /// # Returns
    /// * `Ok(Address)` if configured
    /// * `Err(Error::TreasuryNotSet)` if not initialized
    pub fn get_treasury(env: Env) -> Result<Address, Error> {
        let storage = env.storage().instance();
        storage.get(&TREASURY_KEY)
            .ok_or(Error::TreasuryNotSet)
    }
}
