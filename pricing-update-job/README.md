# Pricing Update Job

This service is a Cloud Run job responsible for downloading and processing AWS EC2 and Savings Plan pricing data into BigQuery. The backend API relies on this data to perform cost calculations.

## Overview

The job performs the following steps:

1.  **Fetches AWS Service Index**: Downloads the main AWS service index to find the latest pricing data URLs.
2.  **Checks for New Versions**: Compares the latest version with the last processed version stored in BigQuery to avoid redundant processing.
3.  **Downloads Pricing Files**: Concurrently downloads the global EC2 pricing CSV and regional Savings Plan CSVs to a Google Cloud Storage bucket.
4.  **Loads Data into BigQuery**: Loads the downloaded CSV files into new BigQuery tables.
5.  **Updates Views**: Updates BigQuery views to point to the new tables, ensuring the API always queries the latest data.
6.  **Cleans Up**: Deletes old BigQuery tables and the temporary CSV files from the GCS bucket.

## Setup

### Prerequisites

*   Python 3.12+
*   Google Cloud Project with BigQuery and Cloud Storage access
*   A GCS bucket to temporarily store downloaded pricing files

### 1. Install Dependencies

```bash
# Install dependencies using uv
uv sync
```

### 2. Configure Environment

Copy the example environment file and update it with your GCP settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
# .env

# Google Cloud Project ID
GCP_PROJECT="your-gcp-project-id"

# GCS bucket for temporary file storage
GCS_BUCKET_NAME="your-gcs-bucket-name"

# BigQuery dataset for pricing data
BIGQUERY_DATASET="ec2_pricing"

# (Optional) Comma-separated list of AWS regions for Savings Plan data
# Defaults to a predefined list if not set
AWS_REGIONS="us-east-1,us-west-2,eu-west-1"
```

## Running the Job

You can run the job manually or deploy it as a scheduled Cloud Run job.

### Manual Execution

To run the job locally for a one-time update:

```bash
uv run python main.py
```

**Flags:**

*   `FORCE_UPDATE=true`: Set this environment variable to bypass the version check and force a re-download and processing of all pricing data.
*   `IS_TESTING=true`: Set to `true` to run in testing mode, which only downloads a small subset of the data (the first 100 lines of each file).

### Deployment

The job is designed to be deployed as a scheduled Cloud Run job. The included `Makefile` provides commands to build and deploy the service.

```bash
# Build and push the Docker image
make push

# Deploy as a Cloud Run job
make deploy-job

# (Optional) Schedule the job to run on a recurring basis
make schedule