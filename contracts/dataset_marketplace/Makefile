build:
	soroban contract build

test:
	cargo test

deploy:
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/dataset_marketplace.wasm \
		--source $(SECRET_KEY) \
		--network $(NETWORK)

