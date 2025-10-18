import datetime
import os
import csv
import io
import re
import sys
from typing import Iterable, List, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from google.api_core.exceptions import NotFound, TooManyRequests, Conflict
from google.api_core.retry import Retry, if_exception_type
from google.cloud import bigquery
from google.cloud import storage

# --- Environment Variables ---
BQ_DATASET = os.environ.get("BIGQUERY_DATASET", "price_ingestion")
BQ_TABLE = os.environ.get("BIGQUERY_TABLE", "processed_versions")
BQ_FILES_TABLE = os.environ.get("BIGQUERY_FILES_TABLE", "downloaded_files")
DOWNLOAD_CONCURRENCY = int(os.environ.get("DOWNLOAD_CONCURRENCY", "3"))

# --- AWS Pricing URLs ---
BASE_URL = "https://pricing.us-east-1.amazonaws.com"
SERVICE_INDEX_URL = f"{BASE_URL}/offers/v1.0/aws/index.json"

REQUEST_TIMEOUT_SECONDS = int(os.environ.get("REQUEST_TIMEOUT_SECONDS", "120"))
DOWNLOAD_CHUNK_SIZE = 1024 * 1024  # 1 MiB

DEFAULT_AWS_REGIONS = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "ap-south-1",
    "ap-northeast-3",
    "ap-northeast-2",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ca-central-1",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-north-1",
    "sa-east-1",
]

# --- Clients ---
bigquery_client = bigquery.Client()
storage_client = storage.Client()
PROJECT_ID = (
    os.environ.get("GCP_PROJECT")
    or os.environ.get("GOOGLE_CLOUD_PROJECT")
    or bigquery_client.project
)

if not PROJECT_ID:
    raise EnvironmentError(
        "GCP_PROJECT (or GOOGLE_CLOUD_PROJECT) environment variable is required."
    )

HEADER_ROWS_TO_SKIP = 6
HEADER_ROW_INDEX = HEADER_ROWS_TO_SKIP - 1

# Define a retry strategy for BigQuery operations
bigquery_retry = Retry(
    predicate=if_exception_type(TooManyRequests),
    initial=1.0,  # 1 second
    multiplier=2.0,
    maximum=60.0,  # 60 seconds
    deadline=600.0,  # 10 minutes
)

def get_allowed_regions() -> Iterable[str]:
    """Compute the AWS regions that should receive savings plan download jobs."""
    override = os.environ.get("AWS_REGIONS")
    if not override:
        return DEFAULT_AWS_REGIONS

    regions = [region.strip() for region in override.split(",") if region.strip()]
    return regions or DEFAULT_AWS_REGIONS


def extract_savings_plan_version(version_url: str) -> str:
    """Pull the version component from a savings plan version URL."""
    segments = version_url.strip("/").split("/")
    if len(segments) >= 5:
        return segments[4]
    return ""

def format_version(version_id: str) -> str:
    """
    Formats a version ID. Currently, this is a passthrough,
    but can be extended for specific formatting needs.
    """
    return version_id


def get_table_id(table_name: str) -> str:
    return f"{PROJECT_ID}.{BQ_DATASET}.{table_name}"


def get_bucket_name() -> str:
    bucket_name = os.environ.get("GCS_BUCKET_NAME")
    if not bucket_name:
        raise ValueError("GCS_BUCKET_NAME environment variable not set.")
    return bucket_name


def get_bucket() -> storage.Bucket:
    bucket_name = get_bucket_name()
    bucket = storage_client.bucket(bucket_name)
    if not bucket.exists():
        raise ValueError(f"GCS bucket '{bucket_name}' does not exist.")
    return bucket


def get_current_table_from_view(view_name: str, bigquery_client) -> Optional[str]:
    view_id = get_table_id(view_name)
    try:
        view = bigquery_client.get_table(view_id, retry=bigquery_retry)
        query = view.view_query
        # query = "SELECT * FROM `project.dataset.table`"
        parts = query.split('.')
        if len(parts) >= 3:
            table = parts[-1].strip('`')
            return table
    except NotFound:
        return None
    except Exception as e:
        print(f"Error getting current table from view {view_name}: {e}")
        return None
    return None


def delete_table(table_name: str, bigquery_client) -> None:
    table_id = get_table_id(table_name)
    try:
        bigquery_client.delete_table(table_id, retry=bigquery_retry)
        print(f"Deleted old table {table_id}")
    except NotFound:
        print(f"Old table {table_id} not found, skipping deletion")
    except Exception as e:
        print(f"Error deleting table {table_id}: {e}")


def is_file_downloaded(gcs_filename: str) -> bool:
    """
    Checks if a file has already been successfully downloaded.
    """
    print(f"Checking BigQuery for downloaded file: {gcs_filename}")
    query = (
        "SELECT 1 FROM `{table_id}` WHERE gcs_filename = @gcs_filename AND status = 'success' LIMIT 1"
    ).format(table_id=get_table_id(BQ_FILES_TABLE))
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("gcs_filename", "STRING", gcs_filename),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        return any(query_job)
    except NotFound:
        print(f"BigQuery table {get_table_id(BQ_FILES_TABLE)} not found; assuming file not downloaded.")
        return False
    except Exception as e:
        print(f"Error checking BigQuery for file {gcs_filename}: {e}. Proceeding with download.")
        return False


def is_version_processed(version_id):
    """
    Checks if a given version_id has already been processed and logged in BigQuery.
    """
    print(f"Checking BigQuery for version: {version_id}")
    query = (
        "SELECT 1 FROM `{table_id}` WHERE version_id = @version_id LIMIT 1"
    ).format(table_id=get_table_id(BQ_TABLE))
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("version_id", "STRING", version_id),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        return any(query_job)
    except NotFound:
        print(f"BigQuery table {get_table_id(BQ_TABLE)} not found; assuming version not processed.")
        return False


def log_version_processed(version_id):
    """
    Logs a new version_id to the BigQuery table.
    """
    print(f"Logging version to BigQuery: {version_id}")
    table_id = get_table_id(BQ_TABLE)
    timestamp = (
        datetime.datetime.now(datetime.timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )
    rows = [
        {
            "version_id": version_id,
            "processing_timestamp": timestamp,
        }
    ]

    try:
        errors = bigquery_client.insert_rows_json(table_id, rows)
    except NotFound:
        # Create the table if it doesn't exist
        schema = [
            bigquery.SchemaField("version_id", "STRING"),
            bigquery.SchemaField("processing_timestamp", "STRING"),
        ]
        table = bigquery.Table(table_id, schema=schema)
        bigquery_client.create_table(table)
        print(f"Created BigQuery table {table_id}")
        # Retry insert
        errors = bigquery_client.insert_rows_json(table_id, rows)

    if errors:
        raise RuntimeError(f"Failed to log version {version_id}: {errors}")


def log_file_downloaded(gcs_filename: str, url: str, size_bytes: int):
    """
    Logs a successful file download to BigQuery.
    """
    print(f"Logging file download to BigQuery: {gcs_filename}")
    table_id = get_table_id(BQ_FILES_TABLE)
    timestamp = (
        datetime.datetime.now(datetime.timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )
    rows = [
        {
            "gcs_filename": gcs_filename,
            "url": url,
            "status": "success",
            "download_timestamp": timestamp,
            "size_bytes": size_bytes,
        }
    ]

    try:
        errors = bigquery_client.insert_rows_json(table_id, rows)
        if errors:
            print(f"Failed to log file download {gcs_filename}: {errors}")
        else:
            print(f"Successfully logged file download: {gcs_filename}")
    except NotFound:
        # Create the table if it doesn't exist
        schema = [
            bigquery.SchemaField("gcs_filename", "STRING"),
            bigquery.SchemaField("url", "STRING"),
            bigquery.SchemaField("status", "STRING"),
            bigquery.SchemaField("download_timestamp", "STRING"),
            bigquery.SchemaField("size_bytes", "INTEGER"),
        ]
        table = bigquery.Table(table_id, schema=schema)
        bigquery_client.create_table(table)
        print(f"Created BigQuery table {table_id}")
        # Retry insert
        errors = bigquery_client.insert_rows_json(table_id, rows)
        if errors:
            print(f"Failed to log file download {gcs_filename}: {errors}")
        else:
            print(f"Successfully logged file download: {gcs_filename}")
    except Exception as e:
        print(f"Error logging file download {gcs_filename}: {e}")


def parse_line_limit(value: Optional[object]) -> Optional[int]:
    if value is None:
        return None
    try:
        if isinstance(value, (str, int, float)): # Ensure value is convertible to int
            limit = int(value)
        else:
            raise ValueError("Value is not a valid number type")
    except (TypeError, ValueError):
        print(f"Ignoring invalid line_limit value: {value}")
        return None
    return limit if limit > 0 else None


def read_header_row(blob_name: str) -> List[str]:
    bucket_name = get_bucket_name()
    bucket = get_bucket()
    blob = bucket.blob(blob_name)
    if not blob.exists():
        print(f"WARNING: Blob gs://{bucket_name}/{blob_name} not found during header read. Skipping.")
        return [] # Return empty list or raise a specific exception if needed

    with blob.open("rb") as binary_stream:
        with io.TextIOWrapper(binary_stream, encoding="utf-8") as text_stream:
            try:
                for _ in range(HEADER_ROW_INDEX):
                    next(text_stream)
                header_line = next(text_stream)
            except StopIteration as exc:
                raise RuntimeError(
                    "Could not locate header row within the first few lines of the CSV."
                ) from exc

    reader = csv.reader([header_line])
    header = next(reader)
    return [column.strip() for column in header]


def sanitize_column_name(column: str) -> str:
    column = column.strip()
    column = re.sub(r"[^0-9a-zA-Z_]+", "_", column)
    column = re.sub(r"_+", "_", column)
    column = column.strip("_") or "column"
    if column[0].isdigit():
        column = f"col_{column}"
    return column.lower()


def build_schema(header: Iterable[str]) -> List[bigquery.SchemaField]:
    schema: List[bigquery.SchemaField] = []
    seen = set()
    for raw_name in header:
        name = sanitize_column_name(raw_name)
        base_name = name
        suffix = 1
        while name in seen:
            name = f"{base_name}_{suffix}"
            suffix += 1
        seen.add(name)
        schema.append(bigquery.SchemaField(name, "STRING"))
    return schema


def parse_resource_names(gcs_filename: str) -> Tuple[str, str]:
    base_name = os.path.splitext(os.path.basename(gcs_filename))[0]

    if base_name.startswith("ec2_global_pricing_"):
        table_name = base_name
        view_name = "ec2_global_pricing_latest"
        return table_name, view_name

    if base_name.startswith("savings_plan_"):
        remainder = base_name[len("savings_plan_"):]
        region_part, _, version_part = remainder.rpartition("_")
        if not region_part or not version_part:
            raise ValueError(f"Invalid savings plan filename: {gcs_filename}")

        region_for_bq = region_part.replace("-", "_")
        table_name = f"savings_plan_{region_for_bq}_{version_part}"
        view_name = f"savings_plan_{region_for_bq}_latest"
        return table_name, view_name

    raise ValueError(f"Unsupported filename format: {gcs_filename}")


def load_csv_to_bigquery(
    bucket_name: str,
    blob_name: str,
    table_name: str,
    schema: List[bigquery.SchemaField],
    bigquery_client,
) -> None:
    table_id = get_table_id(table_name)
    uri = f"gs://{bucket_name}/{blob_name}"
    job_config = bigquery.LoadJobConfig(
        schema=schema,
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=HEADER_ROWS_TO_SKIP,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        allow_quoted_newlines=True,
    )

    print(f"Starting load job for {uri} into {table_id}")
    load_job = bigquery_client.load_table_from_uri(
        uri, table_id, job_config=job_config, retry=bigquery_retry
    )
    load_job.result()
    print(f"Completed load job {load_job.job_id} for {table_id}")


def update_latest_view(table_name: str, view_name: str, bigquery_client) -> Optional[str]:
    old_table = get_current_table_from_view(view_name, bigquery_client)

    view_id = get_table_id(view_name)
    query = f"SELECT * FROM `{PROJECT_ID}.{BQ_DATASET}.{table_name}`"
    view = bigquery.Table(view_id)
    view.view_query = query

    try:
        bigquery_client.create_table(view, retry=bigquery_retry)
        print(f"Created view {view_id}")
    except Conflict:
        existing_view = bigquery_client.get_table(view_id, retry=bigquery_retry)
        existing_view.view_query = query
        bigquery_client.update_table(existing_view, ["view_query"], retry=bigquery_retry)
        print(f"Updated view {view_id}")
    except Exception as e:
        print(f"Error creating/updating view {view_id}: {e}")
        raise

    return old_table
def download_file(url: str, gcs_filename: str, line_limit: Optional[int] = None) -> Tuple[str, int]:
    """
    Downloads a file from URL to GCS and returns (gcs_filename, size_bytes).
    """
    bucket_name = get_bucket_name()
    bucket = get_bucket()
    blob = bucket.blob(gcs_filename)

    # Check if blob already exists
    if blob.exists():
        blob.reload()
        if blob.size and blob.size > 0:
            print(f"Blob {gcs_filename} already exists ({blob.size} bytes). Skipping download.")
            return gcs_filename, blob.size

    downloaded_bytes = 0
    print(f"[DEBUG] Attempting to download from URL: {url}")
    print(f"[DEBUG] Target GCS path: gs://{bucket_name}/{gcs_filename}")
    print(f"[DEBUG] Request timeout: {REQUEST_TIMEOUT_SECONDS} seconds")
    
    try:
        print(f"[DEBUG] Making HTTP GET request to: {url}")
        with requests.get(url, stream=True, timeout=REQUEST_TIMEOUT_SECONDS) as r:
            print(f"[DEBUG] HTTP response status: {r.status_code}")
            print(f"[DEBUG] HTTP response headers: {dict(r.headers)}")
            
            if r.status_code == 404:
                print(f"[ERROR] 404 Not Found for URL: {url}")
                print("[ERROR] This suggests the URL is incorrect or the file doesn't exist")
                print("[ERROR] Check if the URL construction logic is correct")
                
            r.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed for URL: {url}")
        print(f"[ERROR] Exception details: {e}")
        raise
    
    print(f"Starting download stream from {url} to gs://{bucket_name}/{gcs_filename}")
    with requests.get(url, stream=True, timeout=REQUEST_TIMEOUT_SECONDS) as r:
        r.raise_for_status()
        with blob.open("wb") as f:
            if line_limit:
                print(f"TESTING MODE: Downloading first {line_limit} lines.")
                for i, line in enumerate(r.iter_lines()):
                    if i >= line_limit:
                        break
                    f.write(line)
                    f.write(b"\n")
                    downloaded_bytes += len(line) + 1
                    if downloaded_bytes % (100 * DOWNLOAD_CHUNK_SIZE) == 0:
                        print(f"Downloaded and uploaded {downloaded_bytes / (1024 * 1024):.2f} MiB of {gcs_filename} to gs://{bucket_name}...")
            else:
                for chunk in r.iter_content(chunk_size=DOWNLOAD_CHUNK_SIZE):
                    if not chunk:
                        continue
                    f.write(chunk)
                    downloaded_bytes += len(chunk)
                    if downloaded_bytes % (100 * DOWNLOAD_CHUNK_SIZE) == 0:
                        print(f"Downloaded and uploaded {downloaded_bytes / (1024 * 1024):.2f} MiB of {gcs_filename} to gs://{bucket_name}...")

    print(f"Successfully downloaded {downloaded_bytes / (1024 * 1024):.2f} MiB from {url} to gs://{bucket_name}/{gcs_filename}")
    return gcs_filename, downloaded_bytes


def process_download_job(url: str, gcs_filename: str, is_testing: bool) -> Tuple[str, int]:
    """
    Process a single download job: download to GCS, log to BigQuery.
    Returns (gcs_filename, size_bytes) for later processing.
    """
    print(f"Processing download job for {url} to {gcs_filename}")

    # Check BigQuery for existing successful download
    if is_file_downloaded(gcs_filename):
        print(f"File {gcs_filename} already downloaded successfully. Skipping.")
        # Still return something for consistency, but size 0 to indicate skip
        return gcs_filename, 0

    line_limit = 100 if is_testing else None
    gcs_filename, size_bytes = download_file(url, gcs_filename, line_limit)

    # Log successful download to BigQuery
    log_file_downloaded(gcs_filename, url, size_bytes)

    return gcs_filename, size_bytes


def delete_blob(blob_name: str) -> None:
    bucket_name = get_bucket_name()
    bucket = get_bucket()
    blob = bucket.blob(blob_name)
    if blob.exists():
        blob.delete()
        print(f"Deleted source object gs://{bucket_name}/{blob_name}")
    else:
        print(f"WARNING: Blob gs://{bucket_name}/{blob_name} not found during deletion. It may have been processed by another instance.")


def load_and_cleanup_file(gcs_filename: str):
    """
    Load a downloaded file to BigQuery and clean up GCS.
    """
    bucket_name = get_bucket_name()

    try:
        header = read_header_row(gcs_filename)
        if not header:
            print(f"Skipping BigQuery load for gs://{bucket_name}/{gcs_filename} due to missing header.")
            return

        schema = build_schema(header)
        table_name, view_name = parse_resource_names(gcs_filename)

        load_csv_to_bigquery(bucket_name, gcs_filename, table_name, schema, bigquery_client)
        old_table = update_latest_view(table_name, view_name, bigquery_client)
        if old_table and old_table != table_name:
            delete_table(old_table, bigquery_client)

    except Exception as e:
        print(f"ERROR: Failed to process gs://{bucket_name}/{gcs_filename} due to: {e}")
    finally:
        delete_blob(gcs_filename)
        print(f"Finished processing gs://{bucket_name}/{gcs_filename}")


def main():
    """
    Main entry point for the consolidated pricing update job.
    """
    allowed_regions = list(get_allowed_regions())
    print(
        "Consolidated pricing update job started.",
        f"Savings plan regions to process: {allowed_regions}",
    )

    # Parse force_update flag (could be passed as env var or arg)
    force_update = os.environ.get("FORCE_UPDATE", "false").lower() == "true"
    if force_update:
        print("FORCE UPDATE: Bypassing version check and proceeding with downloads.")

    is_testing = os.environ.get("IS_TESTING", "false").lower() == "true"
    if is_testing:
        print("TESTING MODE: Download line limit will be set.")

    try:
        # 1. Fetch Service Index
        print(f"[DEBUG] Fetching AWS service index from: {SERVICE_INDEX_URL}")
        response = requests.get(SERVICE_INDEX_URL, timeout=REQUEST_TIMEOUT_SECONDS)
        print(f"[DEBUG] Service index response status: {response.status_code}")
        response.raise_for_status()
        service_index = response.json()
        print("Successfully fetched service index.")
        
        # Log available offers
        offers = service_index.get("offers", {})
        print(f"[DEBUG] Available offers in service index: {list(offers.keys())}")

        # 2. Find AmazonEC2 Offer
        ec2_offer = service_index.get("offers", {}).get("AmazonEC2")
        if not ec2_offer:
            print("ERROR: AmazonEC2 offer not found.")
            print(f"[DEBUG] Available offers: {list(service_index.get('offers', {}).keys())}")
            return "AmazonEC2 offer not found", 500

        print(f"[DEBUG] EC2 offer keys: {list(ec2_offer.keys())}")
        version_index_path = ec2_offer.get("versionIndexUrl")
        if not version_index_path:
            print("ERROR: versionIndexUrl not found for AmazonEC2 offer.")
            print(f"[DEBUG] EC2 offer structure: {ec2_offer}")
            return "AmazonEC2 offer missing versionIndexUrl", 500

        version_index_url = f"{BASE_URL}{version_index_path}"
        print(f"[DEBUG] Version index URL: {version_index_url}")

        # 3. Check for New Global Pricing Version
        print(f"[DEBUG] Fetching version data from: {version_index_url}")
        response = requests.get(version_index_url, timeout=REQUEST_TIMEOUT_SECONDS)
        print(f"[DEBUG] Version index response status: {response.status_code}")
        response.raise_for_status()
        version_data = response.json()
        latest_version_id = version_data.get("currentVersion")
        if not latest_version_id:
            print("ERROR: Failed to determine latest version ID.")
            print(f"[DEBUG] Version data structure: {list(version_data.keys())}")
            return "Missing latest version ID", 500

        print(f"Latest EC2 pricing version ID: {latest_version_id}")
        print(f"[DEBUG] Available versions: {list(version_data.get('versions', {}).keys())[:5]}...")

        # 4. BigQuery State Management
        if not force_update and is_version_processed(latest_version_id):
            print(f"Version {latest_version_id} has already been processed. Exiting.")
            return "Pricing data is already up to date.", 200

        # 5. Collect all download jobs
        download_jobs = []

        # Global On-Demand & Reserved Pricing
        version_entry = version_data.get("versions", {}).get(latest_version_id, {})
        offer_version_url = version_entry.get("offerVersionUrl")
        if offer_version_url:
            global_pricing_url = f"{BASE_URL}{offer_version_url}".replace(".json", ".csv")
            gcs_filename = f"ec2_global_pricing_{latest_version_id}.csv"
            print("[DEBUG] Global pricing URL construction:")
            print(f"[DEBUG]   offer_version_url: {offer_version_url}")
            print(f"[DEBUG]   constructed URL: {global_pricing_url}")
            print(f"[DEBUG]   GCS filename: {gcs_filename}")
            
            if not is_file_downloaded(gcs_filename):
                download_jobs.append((global_pricing_url, gcs_filename))
                print("[DEBUG] Added global pricing job to download queue")
            else:
                print(f"Skipping already downloaded file: {gcs_filename}")
        else:
            print(f"[WARNING] No offerVersionUrl found for version {latest_version_id}")

        # Savings Plan Downloads
        savings_plan_index_url = ec2_offer.get("currentSavingsPlanIndexUrl")
        if savings_plan_index_url:
            savings_plan_url = f"{BASE_URL}{savings_plan_index_url}"
            print(f"[DEBUG] Fetching savings plan index from: {savings_plan_url}")
            
            response = requests.get(
                savings_plan_url, timeout=REQUEST_TIMEOUT_SECONDS
            )
            response.raise_for_status()
            savings_plan_index = response.json()
            regions = savings_plan_index.get("regions", [])
            allowed_region_set = set(allowed_regions)
            
            print(f"[DEBUG] Found {len(regions)} regions in savings plan index")
            print(f"[DEBUG] Allowed regions: {list(allowed_regions)}")

            for region_info in regions:
                region_code = region_info.get("regionCode")
                version_url = region_info.get("versionUrl")
                if not region_code or not version_url:
                    print(f"[WARNING] Skipping region with missing data: {region_info}")
                    continue

                if region_code not in allowed_region_set:
                    print(f"Skipping region {region_code} (not in allowed list).")
                    continue

                unformatted_version = extract_savings_plan_version(version_url)
                formatted_version = format_version(unformatted_version) or format_version(latest_version_id)
                # Reconstruct the URL with formatted version
                segments = version_url.strip("/").split("/")
                if len(segments) >= 7 and segments[0] == "savingsPlan" and segments[1] == "v1.0" and segments[2] == "aws" and segments[3] == "AWSComputeSavingsPlan":
                    csv_url = f"{BASE_URL}/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/{formatted_version}/{region_code}/index.csv"
                else:
                    print(f"[WARNING] Unexpected version_url format: {version_url}")
                    csv_url = f"{BASE_URL}{version_url}".replace("index.json", "index.csv")
                
                savings_filename = f"savings_plan_{region_code}_{unformatted_version}.csv"
                
                print(f"[DEBUG] Savings plan URL construction for {region_code}:")
                print(f"[DEBUG]   version_url: {version_url}")
                print(f"[DEBUG]   version_url: {version_url}")
                print(f"[DEBUG]   unformatted version: {unformatted_version}")
                print(f"[DEBUG]   formatted version: {formatted_version}")
                print(f"[DEBUG]   constructed CSV URL: {csv_url}")
                print(f"[DEBUG]   GCS filename: {savings_filename}")
                print(f"[DEBUG]   Extracted version: {extract_savings_plan_version(version_url)}")
                
                if not is_file_downloaded(savings_filename):
                    download_jobs.append((csv_url, savings_filename))
                    print(f"[DEBUG] Added savings plan job for {region_code} to download queue")
                else:
                    print(f"Skipping already downloaded file: {savings_filename}")
        else:
            print("[WARNING] No currentSavingsPlanIndexUrl found in EC2 offer")

        print(f"Collected {len(download_jobs)} download jobs.")

        # 6. Download files concurrently
        downloaded_files = []
        with ThreadPoolExecutor(max_workers=DOWNLOAD_CONCURRENCY) as executor:
            futures = [
                executor.submit(process_download_job, url, filename, is_testing)
                for url, filename in download_jobs
            ]
            for future in as_completed(futures):
                try:
                    gcs_filename, size_bytes = future.result()
                    if size_bytes > 0:  # Only add if actually downloaded
                        downloaded_files.append(gcs_filename)
                except Exception as e:
                    print(f"Download failed: {e}")

        print(f"Downloaded {len(downloaded_files)} files.")

        # 7. Load files to BigQuery sequentially
        for gcs_filename in downloaded_files:
            load_and_cleanup_file(gcs_filename)

        # 8. Log the version as processed
        log_version_processed(latest_version_id)

        print("Consolidated pricing update job completed successfully.")
        return "Job completed successfully.", 200

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to fetch data from AWS: {e}")
        return "Failed to fetch data from AWS", 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return "An unexpected error occurred", 500


if __name__ == "__main__":
    result, code = main()
    print(f"Exit code: {code}, Result: {result}")
    sys.exit(0 if code == 200 else 1)