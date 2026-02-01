.PHONY: help install build dev test lint clean check-boundaries validate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

build: ## Build all packages and apps
	pnpm turbo run build

dev: ## Start development servers
	pnpm turbo run dev --parallel

test: ## Run all tests
	pnpm turbo run test

test-unit: ## Run unit tests
	pnpm turbo run test:unit

test-integration: ## Run integration tests
	pnpm turbo run test:integration

test-e2e: ## Run e2e tests
	pnpm turbo run test:e2e

lint: ## Lint all code
	pnpm turbo run lint

check-boundaries: ## Check module and service boundaries
	pnpm turbo run check-boundaries
	pnpm tsx scripts/check-boundaries.ts

check-tools: ## Check tool invocations go through executor
	pnpm tsx scripts/check-tool-invocations.ts

check-services: ## Check for service duplication
	pnpm tsx scripts/check-service-duplication.ts

validate: check-boundaries check-tools check-services ## Run all validation checks

clean: ## Clean build artifacts
	rm -rf node_modules
	rm -rf apps/*/node_modules apps/*/dist apps/*/.next
	rm -rf packages/*/node_modules packages/*/dist
	rm -rf services/*/node_modules services/*/dist
	rm -rf modules/*/node_modules modules/*/dist

ci-gates: ## Run CI validation gates
	./scripts/ci-gates.sh
