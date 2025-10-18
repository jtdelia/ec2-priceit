# Makefile for AWS EC2 Pricing Update Job Deployment
# Usage: make <target> [e.g., make deploy]
# Set env vars: export GCP_PROJECT=your-project; export GCP_REGION=us-central1; etc.
# Required vars: GCP_PROJECT, GCP_REGION, GCS_BUCKET_NAME, BIGQUERY_DATASET

# Load .env file if it exists
ifneq (,$(wildcard .env))
include .env
endif

# Defaults
SERVICE_NAME ?= pricing-update-job
GCP_REGION ?= us-central1
DOWNLOAD_CONCURRENCY ?= 20
SCHEDULER_JOB_NAME ?= pricing-update-job-daily
SCHEDULER_TIMEZONE ?= UTC
SCHEDULER_SCHEDULE ?= 0 6 * * *
SCHEDULER_HTTP_METHOD ?= POST
BIGQUERY_TABLE ?= processed_versions
BIGQUERY_FILES_TABLE ?= downloaded_files
JOB_SERVICE_ACCOUNT ?= pricing-update-job-sa@$(GCP_PROJECT).iam.gserviceaccount.com
SCHEDULER_SERVICE_ACCOUNT ?= pricing-update-scheduler-sa@$(GCP_PROJECT).iam.gserviceaccount.com
JOB_CPU ?= 2
JOB_MEMORY ?= 8Gi

# Logging
log = @echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] $(1)'

.DEFAULT_GOAL := help

# Phony targets
.PHONY: help deploy enable-apis create-bucket create-repo create-tables push create-job run-job create-scheduler create-iam teardown test

help:
	@$(call log, "Available targets:")
	@echo "  deploy     : Full deployment (enable-apis, create-repo, create-tables, create-iam, push, create-job, create-scheduler)"
	@echo "  enable-apis: Enable required GCP APIs"
	@echo "  create-repo: Create Artifact Registry repository"
	@echo "  create-tables: Create BigQuery tables"
	@echo "  create-bucket: Create GCS bucket if it does not exist"
	@echo "  create-iam : Create service accounts and assign IAM roles"
	@echo "  push       : Build and push Docker image to Artifact Registry using Cloud Build"
	@echo "  create-job : Create Cloud Run job"
	@echo "  run-job    : Run Cloud Run job manually"
	@echo "  create-scheduler : Create Cloud Scheduler job"
	@echo "  teardown   : Delete all resources"
	@echo "  test       : Run tests"
	@echo "Required env vars: GCP_PROJECT, GCS_BUCKET_NAME, BIGQUERY_DATASET"

# One-time prerequisites (run once)
enable-apis:
	@$(call log, "Enabling required Google Cloud APIs")
	gcloud services enable \
		artifactregistry.googleapis.com \
		cloudbuild.googleapis.com \
		run.googleapis.com \
		cloudscheduler.googleapis.com \
		bigquery.googleapis.com \
		storage.googleapis.com \
		--project $(GCP_PROJECT) --quiet

create-bucket:
	@$(call log, "Creating GCS bucket if it does not exist")
	@if ! gsutil ls -b gs://$(GCS_BUCKET_NAME) >/dev/null 2>&1; then \
		gsutil mb -p $(GCP_PROJECT) -l $(GCP_REGION) gs://$(GCS_BUCKET_NAME); \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Bucket $(GCS_BUCKET_NAME) already exists"; \
	fi

create-repo:
	@$(call log, "Ensuring Artifact Registry repository pricing-update")
	@if ! gcloud artifacts repositories describe pricing-update --location=$(GCP_REGION) --project=$(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud artifacts repositories create pricing-update \
			--repository-format=docker \
			--location=$(GCP_REGION) \
			--description="Docker repository for pricing-update-job" \
			--project=$(GCP_PROJECT) --quiet; \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Artifact Registry repository already exists"; \
	fi

create-tables:
	@$(call log, "Creating BigQuery dataset if it does not exist")
	@if ! bq show --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET) >/dev/null 2>&1; then \
		bq mk --dataset --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET); \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Dataset $(BIGQUERY_DATASET) already exists"; \
	fi
	@$(call log, "Creating BigQuery tables if they do not exist")
	@if ! bq show --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET).$(BIGQUERY_TABLE) >/dev/null 2>&1; then \
		bq mk --table --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET).$(BIGQUERY_TABLE) version_id:STRING,processing_timestamp:STRING; \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Table $(BIGQUERY_DATASET).$(BIGQUERY_TABLE) already exists"; \
	fi
	@if ! bq show --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET).$(BIGQUERY_FILES_TABLE) >/dev/null 2>&1; then \
		bq mk --table --project_id $(GCP_PROJECT) $(BIGQUERY_DATASET).$(BIGQUERY_FILES_TABLE) gcs_filename:STRING,url:STRING,status:STRING,download_timestamp:STRING,size_bytes:INTEGER; \
	else \
		DATE=$$(date -u +%Y-%m-%dT%H:%M:%SZ); echo "[$$DATE] Table $(BIGQUERY_DATASET).$(BIGQUERY_FILES_TABLE) already exists"; \
	fi

# IAM setup (one-time)
create-iam:
	@$(call log, "Creating service accounts and assigning IAM roles")
	$(eval PROJECT_NUMBER = $(shell gcloud projects describe $(GCP_PROJECT) --format="value(projectNumber)"))
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com" --role="roles/artifactregistry.admin" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com" --role="roles/cloudbuild.builds.editor" --quiet
	@$(call log, "Verifying Cloud Build service account roles:")
	@gcloud projects get-iam-policy $(GCP_PROJECT) --flatten="bindings[].members" --format="table(bindings.role,bindings.members)" --filter="bindings.members:$(PROJECT_NUMBER)@cloudbuild.gserviceaccount.com"
	@if ! gcloud iam service-accounts describe $(JOB_SERVICE_ACCOUNT) --project $(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud iam service-accounts create pricing-update-job-sa --project $(GCP_PROJECT) --display-name="Pricing Update Job SA" --quiet; \
	else \
		echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] Job SA already exists'; \
	fi
	@if ! gcloud iam service-accounts describe $(SCHEDULER_SERVICE_ACCOUNT) --project $(GCP_PROJECT) >/dev/null 2>&1; then \
		gcloud iam service-accounts create pricing-update-scheduler-sa --project $(GCP_PROJECT) --display-name="Pricing Update Scheduler SA" --quiet; \
	else \
		echo '[$(shell date -u +%Y-%m-%dT%H:%M:%SZ)] Scheduler SA already exists'; \
	fi
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/storage.objectAdmin" --quiet
	@gcloud storage buckets add-iam-policy-binding gs://$(GCS_BUCKET_NAME) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/storage.admin" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/bigquery.jobUser" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/bigquery.dataEditor" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/logging.logWriter" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(JOB_SERVICE_ACCOUNT)" --role="roles/monitoring.metricWriter" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SCHEDULER_SERVICE_ACCOUNT)" --role="roles/cloudscheduler.serviceAgent" --quiet
	@gcloud projects add-iam-policy-binding $(GCP_PROJECT) --member="serviceAccount:$(SCHEDULER_SERVICE_ACCOUNT)" --role="roles/run.invoker" --quiet

# Build and push Docker image using Cloud Build
push: create-repo
	@$(call log, "Waiting for Artifact Registry repository to be ready...")
	sleep 5 # Give the repository a moment to fully provision
	@$(call log, "Configuring Docker to authenticate with Artifact Registry")
	gcloud auth configure-docker $(GCP_REGION)-docker.pkg.dev --quiet
	@$(call log, "Building and pushing Docker image with Cloud Build")
	gcloud builds submit --project $(GCP_PROJECT) --tag $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/pricing-update/$(SERVICE_NAME):latest --quiet

# Create Cloud Run job
create-job: push
	@$(call log, "Creating Cloud Run job")
	$(eval ENV_VARS = GCP_PROJECT=$(GCP_PROJECT),GCS_BUCKET_NAME=$(GCS_BUCKET_NAME),BIGQUERY_DATASET=$(BIGQUERY_DATASET),BIGQUERY_TABLE=$(BIGQUERY_TABLE),BIGQUERY_FILES_TABLE=$(BIGQUERY_FILES_TABLE))
	@if [ -n "$(DOWNLOAD_CONCURRENCY)" ]; then ENV_VARS+=$(shell echo ,DOWNLOAD_CONCURRENCY=$(DOWNLOAD_CONCURRENCY)); fi
	@if [ -n "$(AWS_REGIONS)" ]; then ENV_VARS+=$(shell echo ,AWS_REGIONS=$(AWS_REGIONS)); fi
	@if [ -n "$(IS_TESTING)" ]; then ENV_VARS+=$(shell echo ,IS_TESTING=$(IS_TESTING)); fi
	@if [ -n "$(REQUEST_TIMEOUT_SECONDS)" ]; then ENV_VARS+=$(shell echo ,REQUEST_TIMEOUT_SECONDS=$(REQUEST_TIMEOUT_SECONDS)); fi
	gcloud run jobs create $(SERVICE_NAME) \
		--image $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/pricing-update/$(SERVICE_NAME):latest \
		--region $(GCP_REGION) \
		--set-env-vars $(ENV_VARS) \
		--cpu $(JOB_CPU) \
		--memory $(JOB_MEMORY) \
		--service-account $(JOB_SERVICE_ACCOUNT) \
		--project $(GCP_PROJECT) \
		--quiet || \
	gcloud run jobs update $(SERVICE_NAME) \
		--image $(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT)/pricing-update/$(SERVICE_NAME):latest \
		--region $(GCP_REGION) \
		--set-env-vars $(ENV_VARS) \
		--cpu $(JOB_CPU) \
		--memory $(JOB_MEMORY) \
		--service-account $(JOB_SERVICE_ACCOUNT) \
		--project $(GCP_PROJECT) \
		--quiet

# Run Cloud Run job manually
run-job: create-job
	@$(call log, "Running Cloud Run job")
	gcloud run jobs execute $(SERVICE_NAME) \
		--region $(GCP_REGION) \
		--project $(GCP_PROJECT) \
		--wait \
		--quiet

# Create Cloud Scheduler job
create-scheduler: create-job
	@$(call log, "Creating Cloud Scheduler job")
	@gcloud scheduler jobs create http $(SCHEDULER_JOB_NAME) \
		--schedule '$(SCHEDULER_SCHEDULE)' \
		--time-zone $(SCHEDULER_TIMEZONE) \
		--uri https://$(GCP_REGION)-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$(GCP_PROJECT)/jobs/$(SERVICE_NAME):run \
		--http-method $(SCHEDULER_HTTP_METHOD) \
		--oauth-service-account-email $(SCHEDULER_SERVICE_ACCOUNT) \
		--oauth-token-scope https://www.googleapis.com/auth/cloud-platform \
		--attempt-deadline 1800s \
		--location=$(GCP_REGION) \
		--project $(GCP_PROJECT) \
		--quiet || \
	gcloud scheduler jobs update http $(SCHEDULER_JOB_NAME) \
		--schedule '$(SCHEDULER_SCHEDULE)' \
		--time-zone $(SCHEDULER_TIMEZONE) \
		--uri https://$(GCP_REGION)-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$(GCP_PROJECT)/jobs/$(SERVICE_NAME):run \
		--http-method $(SCHEDULER_HTTP_METHOD) \
		--oauth-service-account-email $(SCHEDULER_SERVICE_ACCOUNT) \
		--oauth-token-scope https://www.googleapis.com/auth/cloud-platform \
		--project $(GCP_PROJECT) \
		--location=$(GCP_REGION) \
		--attempt-deadline 1800s \
		--quiet

# Full deployment
deploy: enable-apis create-bucket create-repo create-tables create-iam create-job create-scheduler
	@$(call log, "Deployment completed")

# Teardown
teardown:
	@$(call log, "Starting teardown")
	gcloud scheduler jobs delete $(SCHEDULER_JOB_NAME) --location=$(GCP_REGION) --project=$(GCP_PROJECT) --quiet || true
	gcloud run jobs delete $(SERVICE_NAME) --region $(GCP_REGION) --project=$(GCP_PROJECT) --quiet || true
	gcloud artifacts repositories delete pricing-update --location=$(GCP_REGION) --project=$(GCP_PROJECT) --quiet || true
	gcloud iam service-accounts delete $(JOB_SERVICE_ACCOUNT) --project $(GCP_PROJECT) --quiet || true
	gcloud iam service-accounts delete $(SCHEDULER_SERVICE_ACCOUNT) --project $(GCP_PROJECT) --quiet || true
	@$(call log, "Deleting GCS bucket")
	gsutil rm -r gs://$(GCS_BUCKET_NAME) || true
	@$(call log, "Teardown completed")

# Testing
test:
	@$(call log, "Running tests")
	uv run pytest tests/ -v