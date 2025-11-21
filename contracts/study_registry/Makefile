build:
	soroban contract build

test:
	cargo test

deploy:
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/study_registry.wasm \
		--source $(SECRET_KEY) \
		--network $(NETWORK)

