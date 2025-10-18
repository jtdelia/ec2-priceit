# Makefile for AWS EC2 Pricing API Backend Deployment
# Usage: make <target> [e.g., make deploy]
# Set env vars: export GCP_PROJECT=your-project; export GCP_REGION=us-central1; etc.
# Required vars: GCP_PROJECT, GCP_REGION, BIGQUERY_DATASET

# Load .env file if it exists
ifneq (,$(wildcard .env))
include .env
endif

# Defaults
SERVICE_NAME ?= api-backend
GCP_REGION ?= us-central1
SERVICE_ACCOUNT ?= api-backend-sa@$(GCP_PROJECT).iam.gserviceaccount.com
CPU ?= 1
MEMORY ?= 1Gi
MAX_INSTANCES ?= 2

# Logging
log = @echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] $(1)'

.DEFAULT_GOAL := help

# Phony targets
.PHONY: help deploy enable-apis create-repo push create-service create-iam teardown test

help:
	@$(call log, "Available targets:")
	@echo "  deploy       : Full deployment (enable-apis, create-repo, create-iam, push, create-service)"
	@echo "  enable-apis  : Enable required GCP APIs"
	@echo "  create-repo  : Create Artifact Registry repository"
	@echo "  create-iam   : Create service accounts and assign IAM roles"
	@echo "  push         : Build and push Docker image to Artifact Registry using Cloud Build"
	@echo "  create-service: Create Cloud Run service"
	@echo "  teardown     : Delete all resources"
	@echo "  test         : Run tests"
	@echo "Required env vars: GCP_PROJECT, BIGQUERY_DATASET"

# One-time prerequisites (run once)
enable-apis:
	@$(call log, "Enabling required Google Cloud APIs")
	gcloud services enable \
		artifactregistry.googleapis.com \
		cloudbuild.googleapis.com \
		run.googleapis.com \
		bigquery.googleapis.com \
		--project $(GCP_PROJECT) --quiet

create-repo:
	@$(call log, "Ensuring Artifact Registry repository api-backend")
	@if ! gcloud artifacts repositories describe api-backend --location=$(GCP_REGION) --project=$(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud artifacts repositories create api-backend \
			--repository-format=docker \
			--location=$(GCP_REGION) \
			--description="Docker repository for api-backend" \
			--project=$(GCP_PROJECT) --quiet; \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Artifact Registry repository already exists"; \
	fi

# IAM setup (one-time)
create-iam:
	@$(call log, "Creating service accounts and assigning IAM roles")
	$(eval PROJECT_NUMBER = $(shell gcloud projects describe $(GCP_PROJECT) --format="value(projectNumber)"))
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com" --role="roles/artifactregistry.admin" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com" --role="roles/cloudbuild.builds.editor" --quiet
	@$(call log, "Verifying Cloud Build service account roles:")
	@gcloud projects get-iam-policy $(GCP_PROJECT) --flatten="bindings[].members" --format="table(bindings.role,bindings.members)" --filter="bindings.members:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com"
	@if ! gcloud iam service-accounts describe $(SERVICE_ACCOUNT) --project $(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud iam service-accounts create api-backend-sa --project $(GCP_PROJECT) --display-name="API Backend SA" --quiet; \
	else \
		echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] Service SA already exists'; \
	fi
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/bigquery.jobUser" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/bigquery.dataViewer" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/logging.logWriter" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SERVICE_ACCOUNT)" --role="roles/monitoring.metricWriter" --quiet

# Build and push Docker image using Cloud Build
push: create-repo
	@$(call log, "Waiting for Artifact Registry repository to be ready...")
	sleep 5 # Give the repository a moment to fully provision
	@$(call log, "Configuring Docker to authenticate with Artifact Registry")
	gcloud auth configure-docker $(GCP_REGION)-docker.pkg.dev --quiet
	@$(call log, "Building and pushing Docker image with Cloud Build")
	gcloud builds submit --project $(GCP_PROJECT) --tag $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/api-backend/$(SERVICE_NAME):latest --quiet

# Create Cloud Run service
create-service: push
	@$(call log, "Creating Cloud Run service")
	$(eval ENV_VARS = GCP_PROJECT=$(GCP_PROJECT),BIGQUERY_DATASET=$(BIGQUERY_DATASET),BIGQUERY_TABLE_EC2_GLOBAL=ec2_global_pricing_latest,BIGQUERY_TABLE_SAVINGS_PLAN_PREFIX=savings_plan_)
	$(if $(CORS_ALLOWED_ORIGINS),$(eval ENV_VARS := $(ENV_VARS),CORS_ALLOWED_ORIGINS=$(CORS_ALLOWED_ORIGINS)))
	gcloud run deploy $(SERVICE_NAME) \
		--image $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/api-backend/$(SERVICE_NAME):latest \
		--region $(GCP_REGION) \
		--set-env-vars $(ENV_VARS) \
		--cpu $(CPU) \
		--memory $(MEMORY) \
		--max-instances $(MAX_INSTANCES) \
		--service-account $(SERVICE_ACCOUNT) \
		--allow-unauthenticated \
		--port 8080 \
		--timeout 300 \
		--project $(GCP_PROJECT) \
		--quiet

# Full deployment
deploy: enable-apis create-repo create-iam create-service
	@$(call log, "Deployment completed")

# Teardown
teardown:
	@$(call log, "Starting teardown")
	gcloud run services delete $(SERVICE_NAME) --region $(GCP_REGION) --project $(GCP_PROJECT) --quiet || true
	gcloud artifacts repositories delete api-backend --location=$(GCP_REGION) --project=$(GCP_PROJECT) --quiet || true
	gcloud iam service-accounts delete $(SERVICE_ACCOUNT) --project $(GCP_PROJECT) --quiet || true
	@$(call log, "Teardown completed")

# Testing
test:
	@$(call log, "Running tests")
	uv run pytest tests/ -v