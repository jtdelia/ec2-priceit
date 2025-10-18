# Makefile for AWS EC2 Pricing Frontend Deployment
# Usage: make <target> [e.g., make deploy]
# Set env vars: export GCP_PROJECT=your-project; export GCP_REGION=us-central1; etc.
# Required vars: GCP_PROJECT, VITE_BACKEND_API_URL, VITE_GOOGLE_OAUTH_CLIENT_ID

# Load .env file if it exists
ifneq (,$(wildcard .env))
include .env
endif

# Defaults
SERVICE_NAME ?= frontend
GCP_REGION ?= us-central1
CPU ?= 1
MEMORY ?= 512Mi
MAX_INSTANCES ?= 10

# Logging
log = @echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] $(1)'

.DEFAULT_GOAL := help

# Phony targets
.PHONY: help deploy enable-apis create-repo push create-service teardown test build

help:
	@$(call log, "Available targets:")
	@echo "  deploy       : Full deployment (enable-apis, create-repo, push, create-service)"
	@echo "  enable-apis  : Enable required GCP APIs"
	@echo "  create-repo  : Create Artifact Registry repository"
	@echo "  push         : Build and push Docker image to Artifact Registry using Cloud Build"
	@echo "  create-service: Create Cloud Run service"
	@echo "  teardown     : Delete all resources"
	@echo "  build        : Build the application locally"
	@echo "  test         : Run tests"
	@echo "Required env vars: GCP_PROJECT, VITE_BACKEND_API_URL, VITE_GOOGLE_OAUTH_CLIENT_ID"

# One-time prerequisites (run once)
enable-apis:
	@$(call log, "Enabling required Google Cloud APIs")
	gcloud services enable \
		artifactregistry.googleapis.com \
		cloudbuild.googleapis.com \
		run.googleapis.com \
		--project $(GCP_PROJECT) --quiet

create-repo:
	@$(call log, "Ensuring Artifact Registry repository frontend")
	@if ! gcloud artifacts repositories describe frontend --location=$(GCP_REGION) --project=$(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud artifacts repositories create frontend \
			--repository-format=docker \
			--location=$(GCP_REGION) \
			--description="Docker repository for frontend" \
			--project=$(GCP_PROJECT) --quiet; \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Artifact Registry repository already exists"; \
	fi

# Build and push Docker image using Cloud Build
push: create-repo
	@$(call log, "Waiting for Artifact Registry repository to be ready...")
	sleep 5 # Give the repository a moment to fully provision
	@$(call log, "Configuring Docker to authenticate with Artifact Registry")
	gcloud auth configure-docker $(GCP_REGION)-docker.pkg.dev --quiet
	@$(call log, "Building and pushing Docker image with Cloud Build")
	gcloud builds submit --config=cloudbuild.yaml \
		--substitutions=_VITE_BACKEND_API_URL=$(VITE_BACKEND_API_URL),_VITE_GOOGLE_OAUTH_CLIENT_ID=$(VITE_GOOGLE_OAUTH_CLIENT_ID),_ARTIFACT_REGISTRY_URL=$(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/frontend \
		--project $(GCP_PROJECT) \
		--quiet

# Create Cloud Run service
create-service: push
	@$(call log, "Creating Cloud Run service")
	gcloud run deploy $(SERVICE_NAME) \
		--image $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/frontend/frontend:latest \
		--region $(GCP_REGION) \
		--cpu $(CPU) \
		--memory $(MEMORY) \
		--max-instances $(MAX_INSTANCES) \
		--allow-unauthenticated \
		--port 8080 \
		--timeout 300 \
		--project $(GCP_PROJECT) \
		--quiet

# Full deployment
deploy: enable-apis create-repo create-service
	@$(call log, "Deployment completed")

# Teardown
teardown:
	@$(call log, "Starting teardown")
	gcloud run services delete $(SERVICE_NAME) --region $(GCP_REGION) --project $(GCP_PROJECT) --quiet || true
	gcloud artifacts repositories delete frontend --location=$(GCP_REGION) --project=$(GCP_PROJECT) --quiet || true
	@$(call log, "Teardown completed")

# Local build
build:
	@$(call log, "Building the application locally")
	npm run build

# Testing
test:
	@$(call log, "Running tests")
	npm test