from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import logging
from dotenv import load_dotenv
from google.cloud import bigquery, logging as cloud_logging
from google.auth import default
from google.auth.exceptions import DefaultCredentialsError
import google.auth.transport.requests
import google.oauth2.credentials
import googleapiclient.discovery

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
BQ_DATASET = os.environ.get("BIGQUERY_DATASET", "ec2_pricing_files")
BQ_TABLE_EC2_GLOBAL = os.environ.get("BIGQUERY_TABLE_EC2_GLOBAL", "ec2_global_pricing_latest")
BQ_TABLE_SAVINGS_PLAN_PREFIX = os.environ.get("BIGQUERY_TABLE_SAVINGS_PLAN_PREFIX", "savings_plan_")
PROJECT_ID = (
    os.environ.get("GCP_PROJECT")
    or os.environ.get("GOOGLE_CLOUD_PROJECT")
)

# CORS configuration
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS")
if CORS_ALLOWED_ORIGINS:
    # Parse comma-separated list of origins
    cors_origins = [origin.strip() for origin in CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
else:
    # Default origins for development
    cors_origins = [
        "http://localhost:8080",  # Local development
        "https://*.run.app",      # Cloud Run domains (note: wildcard may not work with credentials)
        "https://*.googleusercontent.com",  # GCP domains
    ]

# Initialize FastAPI app
app = FastAPI(title="AWS EC2 Pricing API Backend", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# BigQuery client with authentication
def initialize_bigquery_client():
    """Initialize BigQuery client with proper authentication"""
    global PROJECT_ID
    try:
        # Try to get default credentials (works in Cloud Run with service account)
        credentials, project = default()
        if not PROJECT_ID:
            PROJECT_ID = project
        logger.info(f"Using Google Cloud project: {PROJECT_ID}")
        return bigquery.Client(credentials=credentials, project=PROJECT_ID)
    except DefaultCredentialsError as e:
        logger.error(f"Failed to get default credentials: {e}")
        # Fallback for local development - requires GOOGLE_APPLICATION_CREDENTIALS
        if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            logger.info("Using service account key file for authentication")
            return bigquery.Client()
        else:
            raise RuntimeError(
                "BigQuery authentication failed. Set GOOGLE_APPLICATION_CREDENTIALS "
                "environment variable or run on Google Cloud with service account."
            )

bigquery_client = initialize_bigquery_client()

# Setup Google Cloud Logging
def setup_cloud_logging():
    """Setup Google Cloud Logging for structured logging"""
    try:
        # Initialize Cloud Logging client
        logging_client = cloud_logging.Client()
        # Setup Python logging to use Cloud Logging
        logging_client.setup_logging()

        # Get the root logger and set level
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)

        # Create a custom handler for structured logging
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)

        # Create formatter for structured logging
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"logger": "%(name)s", "message": "%(message)s"}'
        )
        handler.setFormatter(formatter)

        # Add handler to root logger if not already present
        if not any(isinstance(h, logging.StreamHandler) for h in root_logger.handlers):
            root_logger.addHandler(handler)

        logger.info("Google Cloud Logging initialized successfully")
    except Exception as e:
        # Fallback to basic logging if Cloud Logging fails
        logging.basicConfig(
            level=logging.INFO,
            format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
                   '"logger": "%(name)s", "message": "%(message)s"}'
        )
        logger.warning(f"Failed to initialize Google Cloud Logging: {e}")

setup_cloud_logging()

# Pydantic models for input/output

class EC2InstanceInput(BaseModel):
    """Input model for EC2 instance data from frontend"""
    region_code: str
    instance_type: str
    operation: str
    operating_system: str
    product_tenancy: str = "Shared"
    qty: int = 1

class EC2Instance(BaseModel):
    """Internal model for EC2 instance data (after sanitization)"""
    region_code: str
    instance_type: str
    operation: str
    operating_system: str
    product_tenancy: str = "Shared"
    qty: int = 1

class PricingScenario(BaseModel):
    """Model for individual pricing scenario results"""
    scenario: str
    total_cost: float
    upfront_fee: Optional[float] = None
    plan_cost: Optional[float] = None

class PricingResults(BaseModel):
    """Complete pricing results for all scenarios"""
    on_demand_hourly_rate: float
    on_demand_1_year_total_cost: float
    on_demand_3_year_total_cost: float
    
    # Compute Savings Plan 1 Year
    compute_savings_plan_1_year_no_upfront_total_cost: float
    compute_savings_plan_1_year_no_upfront_hourly_rate: float
    compute_savings_plan_1_year_partial_upfront_total_cost: Dict[str, float]  # {"total_cost": x, "upfront_fee": y, "plan_cost": z}
    compute_savings_plan_1_year_partial_upfront_hourly_rate: float
    compute_savings_plan_1_year_all_upfront_total_cost: float
    compute_savings_plan_1_year_all_upfront_hourly_rate: float
    
    # Compute Savings Plan 3 Year
    compute_savings_plan_3_year_no_upfront_total_cost: float
    compute_savings_plan_3_year_no_upfront_hourly_rate: float
    compute_savings_plan_3_year_partial_upfront_total_cost: Dict[str, float]
    compute_savings_plan_3_year_partial_upfront_hourly_rate: float
    compute_savings_plan_3_year_all_upfront_total_cost: float
    compute_savings_plan_3_year_all_upfront_hourly_rate: float
    
    # EC2 Savings Plan 1 Year
    ec2_savings_plan_1_year_no_upfront_total_cost: float
    ec2_savings_plan_1_year_no_upfront_hourly_rate: float
    ec2_savings_plan_1_year_partial_upfront_total_cost: Dict[str, float]
    ec2_savings_plan_1_year_partial_upfront_hourly_rate: float
    ec2_savings_plan_1_year_all_upfront_total_cost: float
    ec2_savings_plan_1_year_all_upfront_hourly_rate: float
    
    # EC2 Savings Plan 3 Year
    ec2_savings_plan_3_year_no_upfront_total_cost: float
    ec2_savings_plan_3_year_no_upfront_hourly_rate: float
    ec2_savings_plan_3_year_partial_upfront_total_cost: Dict[str, float]
    ec2_savings_plan_3_year_partial_upfront_hourly_rate: float
    ec2_savings_plan_3_year_all_upfront_total_cost: float
    ec2_savings_plan_3_year_all_upfront_hourly_rate: float
    
    # Standard Reserved Instance 1 Year
    standard_reserved_instance_1_year_no_upfront_total_cost: float
    standard_reserved_instance_1_year_no_upfront_hourly_rate: float
    standard_reserved_instance_1_year_partial_upfront_total_cost: Dict[str, float]
    standard_reserved_instance_1_year_partial_upfront_hourly_rate: float
    standard_reserved_instance_1_year_all_upfront_total_cost: float
    standard_reserved_instance_1_year_all_upfront_hourly_rate: float
    
    # Standard Reserved Instance 3 Year
    standard_reserved_instance_3_year_no_upfront_total_cost: float
    standard_reserved_instance_3_year_no_upfront_hourly_rate: float
    standard_reserved_instance_3_year_partial_upfront_total_cost: Dict[str, float]
    standard_reserved_instance_3_year_partial_upfront_hourly_rate: float
    standard_reserved_instance_3_year_all_upfront_total_cost: float
    standard_reserved_instance_3_year_all_upfront_hourly_rate: float

class InstancePricingResponse(BaseModel):
    """Response for single instance pricing"""
    input_data: EC2Instance
    pricing_results: PricingResults
    errors: List[str] = []

class BulkPricingResponse(BaseModel):
    """Response for bulk instance pricing"""
    instances: List[InstancePricingResponse]

class PricingQueryFilters(BaseModel):
    """Filters for pricing data queries"""
    region: Optional[str] = None
    os: Optional[str] = None
    instance_type: Optional[str] = None
    instance_family: Optional[str] = None
    term: Optional[str] = None
    savings_type: Optional[str] = None

class GoogleSheetsExportRequest(BaseModel):
    """Request model for Google Sheets export"""
    pricing_results: List[InstancePricingResponse]
    access_token: str
    spreadsheet_title: Optional[str] = "EC2 Pricing Results"

class TelemetryEvent(BaseModel):
    """Model for telemetry events"""
    event_type: str
    event_data: Dict[str, Any]
    timestamp: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None

# Utility functions

def sanitize_input(instance: Dict[str, Any]) -> EC2Instance:
    """Sanitize and map input instance data to internal model"""
    # The input already uses the correct field names from plan.md
    # Just validate and convert to internal EC2Instance model
    return EC2Instance(**instance)

def get_table_name(scenario: str, region: str) -> str:
    """Get BigQuery table name for pricing scenario"""
    if scenario in ['On-Demand', 'Reserved Instance']:
        return BQ_TABLE_EC2_GLOBAL
    elif scenario in ['Compute Savings Plan', 'EC2 Savings Plan']:
        region_code = region.replace('-', '_')
        return f"{BQ_TABLE_SAVINGS_PLAN_PREFIX}{region_code}_latest"
    else:
        raise ValueError(f"Unknown pricing scenario: {scenario}")

def query_on_demand_pricing(instance: EC2Instance) -> Dict[str, Any]:
    """Query BigQuery for On-Demand pricing data"""
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_EC2_GLOBAL}"

    logger.info(f"Querying on-demand pricing for instance: {instance.model_dump()}")

    # Based on examples/how-to-match-pricing.md
    query = f"""
    SELECT sku, termtype, pricedescription, priceperunit, instance_type, usagetype, operating_system, unit
    FROM `{table_id}`
    WHERE region_code = @region_code
    AND instance_type = @instance_type
    AND operation = @operation
    AND tenancy = @tenancy
    AND termtype = "OnDemand"
    AND usagetype LIKE "%BoxUsage%"
    LIMIT 1
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("region_code", "STRING", instance.region_code),
            bigquery.ScalarQueryParameter("instance_type", "STRING", instance.instance_type),
            bigquery.ScalarQueryParameter("operation", "STRING", instance.operation),
            bigquery.ScalarQueryParameter("tenancy", "STRING", instance.product_tenancy),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        results = [dict(row) for row in query_job]
        logger.info(f"On-demand query results: {results}")
        return results[0] if results else {}
    except Exception as e:
        logger.error(f"BigQuery On-Demand query failed: {str(e)}")
        return {}

def query_reserved_instance_pricing(instance: EC2Instance) -> List[Dict[str, Any]]:
    """Query BigQuery for Reserved Instance pricing data"""
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_EC2_GLOBAL}"

    logger.info(f"Querying RI pricing for instance: {instance.model_dump()}")

    # Based on examples/how-to-match-pricing.md
    query = f"""
    SELECT sku, region_code, termtype, instance_type, usagetype, operating_system,
           pricedescription, priceperunit, unit, currency, leasecontractlength,
           purchaseoption, offeringclass
    FROM `{table_id}`
    WHERE region_code = @region_code
    AND instance_type = @instance_type
    AND operation = @operation
    AND tenancy = @tenancy
    AND termtype LIKE "Reserved"
    AND usagetype LIKE "%BoxUsage%"
    AND offeringclass = "standard"
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("region_code", "STRING", instance.region_code),
            bigquery.ScalarQueryParameter("instance_type", "STRING", instance.instance_type),
            bigquery.ScalarQueryParameter("operation", "STRING", instance.operation),
            bigquery.ScalarQueryParameter("tenancy", "STRING", instance.product_tenancy),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        results = [dict(row) for row in query_job]
        logger.info(f"RI query results count: {len(results)}")
        return results
    except Exception as e:
        logger.error(f"BigQuery Reserved Instance query failed: {str(e)}")
        return []

def query_compute_savings_plan_pricing(instance: EC2Instance) -> List[Dict[str, Any]]:
    """Query BigQuery for Compute Savings Plan pricing data"""
    region_code = instance.region_code.replace('-', '_')
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_SAVINGS_PLAN_PREFIX}{region_code}_latest"

    logger.info(f"Querying Compute SP pricing for instance: {instance.model_dump()}, table: {table_id}")

    # Based on examples/how-to-match-pricing.md
    query = f"""
    SELECT sku, discountedregioncode, discountedinstancetype, product_family, usagetype,
           discountedusagetype, discountedoperation, purchaseoption, leasecontractlength,
           leasecontractlengthunit, discountedrate, currency, unit
    FROM `{table_id}`
    WHERE discountedregioncode = @region_code
    AND discountedinstancetype = @instance_type
    AND discountedoperation = @operation
    AND discountedusagetype LIKE "%-BoxUsage%"
    AND product_family = "ComputeSavingsPlans"
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("region_code", "STRING", instance.region_code),
            bigquery.ScalarQueryParameter("instance_type", "STRING", instance.instance_type),
            bigquery.ScalarQueryParameter("operation", "STRING", instance.operation),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        results = [dict(row) for row in query_job]
        logger.info(f"Compute SP query results count: {len(results)}")
        return results
    except Exception as e:
        logger.error(f"BigQuery Compute Savings Plan query failed: {str(e)}")
        return []

def query_ec2_savings_plan_pricing(instance: EC2Instance) -> List[Dict[str, Any]]:
    """Query BigQuery for EC2 Savings Plan pricing data"""
    region_code = instance.region_code.replace('-', '_')
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_SAVINGS_PLAN_PREFIX}{region_code}_latest"

    logger.info(f"Querying EC2 SP pricing for instance: {instance.model_dump()}, table: {table_id}")

    # Based on examples/how-to-match-pricing.md
    query = f"""
    SELECT sku, discountedregioncode, discountedinstancetype, product_family, usagetype,
           discountedusagetype, discountedoperation, purchaseoption, leasecontractlength,
           leasecontractlengthunit, discountedrate, currency, unit
    FROM `{table_id}`
    WHERE discountedregioncode = @region_code
    AND discountedinstancetype = @instance_type
    AND discountedoperation = @operation
    AND discountedusagetype LIKE "%-BoxUsage%"
    AND product_family = "EC2InstanceSavingsPlans"
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("region_code", "STRING", instance.region_code),
            bigquery.ScalarQueryParameter("instance_type", "STRING", instance.instance_type),
            bigquery.ScalarQueryParameter("operation", "STRING", instance.operation),
        ]
    )

    try:
        query_job = bigquery_client.query(query, job_config=job_config)
        results = [dict(row) for row in query_job]
        logger.info(f"EC2 SP query results count: {len(results)}")
        return results
    except Exception as e:
        logger.error(f"BigQuery EC2 Savings Plan query failed: {str(e)}")
        return []

def calculate_pricing(instance: EC2Instance) -> PricingResults:
    """Calculate all pricing scenarios for an instance"""
    try:
        # Query pricing data from BigQuery
        on_demand_data = query_on_demand_pricing(instance)
        ri_data = query_reserved_instance_pricing(instance)
        compute_sp_data = query_compute_savings_plan_pricing(instance)
        ec2_sp_data = query_ec2_savings_plan_pricing(instance)

        # Update operating_system from database if available
        if on_demand_data and 'operating_system' in on_demand_data:
            instance.operating_system = on_demand_data['operating_system']
        elif ri_data and len(ri_data) > 0 and 'operating_system' in ri_data[0]:
            instance.operating_system = ri_data[0]['operating_system']

        # Extract hourly rates
        on_demand_hourly_rate = float(on_demand_data.get('priceperunit', 0.0)) if on_demand_data else 0.0

        # Calculate On-Demand costs
        hours_1_year = 8760  # 365 * 24
        hours_3_year = 26280  # 3 * 365 * 24

        on_demand_1_year_total_cost = on_demand_hourly_rate * hours_1_year * instance.qty
        on_demand_3_year_total_cost = on_demand_hourly_rate * hours_3_year * instance.qty

        # Helper functions for RI and SP calculations
        def calculate_ri_costs(term_years: int) -> Dict[str, Any]:
            """Calculate RI costs for a given term"""
            term_str = f"{term_years}yr"
            hours = hours_1_year * term_years

            # Filter RI data for this term
            term_ri_data = [row for row in ri_data if row.get('leasecontractlength') == term_str]

            costs = {
                'no_upfront': 0.0,
                'no_upfront_hourly_rate': 0.0,
                'partial_upfront': {'total_cost': 0.0, 'upfront_fee': 0.0, 'plan_cost': 0.0},
                'partial_upfront_hourly_rate': 0.0,
                'all_upfront': 0.0,
                'all_upfront_hourly_rate': 0.0
            }

            for row in term_ri_data:
                purchase_option = row.get('purchaseoption', '')
                price = float(row.get('priceperunit', 0.0))

                if purchase_option == 'No Upfront':
                    # Hourly rate * hours
                    costs['no_upfront'] = price * hours * instance.qty
                    costs['no_upfront_hourly_rate'] = price
                elif purchase_option == 'Partial Upfront':
                    if 'Upfront Fee' in row.get('pricedescription', ''):
                        # This is the upfront fee
                        costs['partial_upfront']['upfront_fee'] = price * instance.qty
                    else:
                        # This is the hourly rate
                        plan_cost = price * hours * instance.qty
                        costs['partial_upfront']['plan_cost'] = plan_cost
                        costs['partial_upfront']['total_cost'] = costs['partial_upfront']['upfront_fee'] + plan_cost
                        costs['partial_upfront_hourly_rate'] = price
                elif purchase_option == 'All Upfront':
                    if 'Upfront Fee' in row.get('pricedescription', ''):
                        # All upfront fee
                        costs['all_upfront'] = price * instance.qty
                        # For all upfront, the effective hourly rate is the total cost / hours
                        costs['all_upfront_hourly_rate'] = (price * instance.qty) / hours if hours > 0 else 0.0
            return costs

        def calculate_sp_costs(plan_type: str, term_years: int) -> Dict[str, Any]:
            """Calculate Savings Plan costs for a given plan type and term"""
            hours = hours_1_year * term_years

            # Filter SP data
            if plan_type == 'compute':
                sp_data = compute_sp_data
            else:  # ec2
                sp_data = ec2_sp_data

            term_sp_data = [row for row in sp_data if str(row.get('leasecontractlength', '')) == str(term_years)]

            costs = {
                'no_upfront': 0.0,
                'no_upfront_hourly_rate': 0.0,
                'partial_upfront': {'total_cost': 0.0, 'upfront_fee': 0.0, 'plan_cost': 0.0},
                'partial_upfront_hourly_rate': 0.0,
                'all_upfront': 0.0,
                'all_upfront_hourly_rate': 0.0
            }

            for row in term_sp_data:
                purchase_option = row.get('purchaseoption', '')
                discounted_rate = float(row.get('discountedrate', 0.0))
                tco = discounted_rate * hours * instance.qty

                if purchase_option == 'No Upfront':
                    costs['no_upfront'] = tco
                    costs['no_upfront_hourly_rate'] = discounted_rate
                elif purchase_option == 'Partial Upfront':
                    # 50% upfront, 50% plan cost
                    upfront_fee = tco * 0.5
                    plan_cost = tco * 0.5
                    costs['partial_upfront'] = {
                        'total_cost': tco,
                        'upfront_fee': upfront_fee,
                        'plan_cost': plan_cost
                    }
                    costs['partial_upfront_hourly_rate'] = discounted_rate
                elif purchase_option == 'All Upfront':
                    costs['all_upfront'] = tco
                    costs['all_upfront_hourly_rate'] = discounted_rate

            return costs

        # Calculate all pricing scenarios
        ri_1_year = calculate_ri_costs(1)
        ri_3_year = calculate_ri_costs(3)
        compute_sp_1_year = calculate_sp_costs('compute', 1)
        compute_sp_3_year = calculate_sp_costs('compute', 3)
        ec2_sp_1_year = calculate_sp_costs('ec2', 1)
        ec2_sp_3_year = calculate_sp_costs('ec2', 3)

        return PricingResults(
            on_demand_hourly_rate=on_demand_hourly_rate,
            on_demand_1_year_total_cost=on_demand_1_year_total_cost,
            on_demand_3_year_total_cost=on_demand_3_year_total_cost,
            
            # Compute Savings Plan 1 Year
            compute_savings_plan_1_year_no_upfront_total_cost=compute_sp_1_year['no_upfront'],
            compute_savings_plan_1_year_no_upfront_hourly_rate=compute_sp_1_year['no_upfront_hourly_rate'],
            compute_savings_plan_1_year_partial_upfront_total_cost=compute_sp_1_year['partial_upfront'],
            compute_savings_plan_1_year_partial_upfront_hourly_rate=compute_sp_1_year['partial_upfront_hourly_rate'],
            compute_savings_plan_1_year_all_upfront_total_cost=compute_sp_1_year['all_upfront'],
            compute_savings_plan_1_year_all_upfront_hourly_rate=compute_sp_1_year['all_upfront_hourly_rate'],
            
            # Compute Savings Plan 3 Year
            compute_savings_plan_3_year_no_upfront_total_cost=compute_sp_3_year['no_upfront'],
            compute_savings_plan_3_year_no_upfront_hourly_rate=compute_sp_3_year['no_upfront_hourly_rate'],
            compute_savings_plan_3_year_partial_upfront_total_cost=compute_sp_3_year['partial_upfront'],
            compute_savings_plan_3_year_partial_upfront_hourly_rate=compute_sp_3_year['partial_upfront_hourly_rate'],
            compute_savings_plan_3_year_all_upfront_total_cost=compute_sp_3_year['all_upfront'],
            compute_savings_plan_3_year_all_upfront_hourly_rate=compute_sp_3_year['all_upfront_hourly_rate'],
            
            # EC2 Savings Plan 1 Year
            ec2_savings_plan_1_year_no_upfront_total_cost=ec2_sp_1_year['no_upfront'],
            ec2_savings_plan_1_year_no_upfront_hourly_rate=ec2_sp_1_year['no_upfront_hourly_rate'],
            ec2_savings_plan_1_year_partial_upfront_total_cost=ec2_sp_1_year['partial_upfront'],
            ec2_savings_plan_1_year_partial_upfront_hourly_rate=ec2_sp_1_year['partial_upfront_hourly_rate'],
            ec2_savings_plan_1_year_all_upfront_total_cost=ec2_sp_1_year['all_upfront'],
            ec2_savings_plan_1_year_all_upfront_hourly_rate=ec2_sp_1_year['all_upfront_hourly_rate'],
            
            # EC2 Savings Plan 3 Year
            ec2_savings_plan_3_year_no_upfront_total_cost=ec2_sp_3_year['no_upfront'],
            ec2_savings_plan_3_year_no_upfront_hourly_rate=ec2_sp_3_year['no_upfront_hourly_rate'],
            ec2_savings_plan_3_year_partial_upfront_total_cost=ec2_sp_3_year['partial_upfront'],
            ec2_savings_plan_3_year_partial_upfront_hourly_rate=ec2_sp_3_year['partial_upfront_hourly_rate'],
            ec2_savings_plan_3_year_all_upfront_total_cost=ec2_sp_3_year['all_upfront'],
            ec2_savings_plan_3_year_all_upfront_hourly_rate=ec2_sp_3_year['all_upfront_hourly_rate'],
            
            # Standard Reserved Instance 1 Year
            standard_reserved_instance_1_year_no_upfront_total_cost=ri_1_year['no_upfront'],
            standard_reserved_instance_1_year_no_upfront_hourly_rate=ri_1_year['no_upfront_hourly_rate'],
            standard_reserved_instance_1_year_partial_upfront_total_cost=ri_1_year['partial_upfront'],
            standard_reserved_instance_1_year_partial_upfront_hourly_rate=ri_1_year['partial_upfront_hourly_rate'],
            standard_reserved_instance_1_year_all_upfront_total_cost=ri_1_year['all_upfront'],
            standard_reserved_instance_1_year_all_upfront_hourly_rate=ri_1_year['all_upfront_hourly_rate'],
            
            # Standard Reserved Instance 3 Year
            standard_reserved_instance_3_year_no_upfront_total_cost=ri_3_year['no_upfront'],
            standard_reserved_instance_3_year_no_upfront_hourly_rate=ri_3_year['no_upfront_hourly_rate'],
            standard_reserved_instance_3_year_partial_upfront_total_cost=ri_3_year['partial_upfront'],
            standard_reserved_instance_3_year_partial_upfront_hourly_rate=ri_3_year['partial_upfront_hourly_rate'],
            standard_reserved_instance_3_year_all_upfront_total_cost=ri_3_year['all_upfront'],
            standard_reserved_instance_3_year_all_upfront_hourly_rate=ri_3_year['all_upfront_hourly_rate'],
        )

    except Exception as e:
        logger.error(f"Error calculating pricing for instance {instance.instance_type}: {str(e)}")
        # Return zero costs on error
        return PricingResults(
            on_demand_hourly_rate=0.0,
            on_demand_1_year_total_cost=0.0,
            on_demand_3_year_total_cost=0.0,

            # Compute Savings Plan 1 Year
            compute_savings_plan_1_year_no_upfront_total_cost=0.0,
            compute_savings_plan_1_year_no_upfront_hourly_rate=0.0,
            compute_savings_plan_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            compute_savings_plan_1_year_partial_upfront_hourly_rate=0.0,
            compute_savings_plan_1_year_all_upfront_total_cost=0.0,
            compute_savings_plan_1_year_all_upfront_hourly_rate=0.0,

            # Compute Savings Plan 3 Year
            compute_savings_plan_3_year_no_upfront_total_cost=0.0,
            compute_savings_plan_3_year_no_upfront_hourly_rate=0.0,
            compute_savings_plan_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            compute_savings_plan_3_year_partial_upfront_hourly_rate=0.0,
            compute_savings_plan_3_year_all_upfront_total_cost=0.0,
            compute_savings_plan_3_year_all_upfront_hourly_rate=0.0,

            # EC2 Savings Plan 1 Year
            ec2_savings_plan_1_year_no_upfront_total_cost=0.0,
            ec2_savings_plan_1_year_no_upfront_hourly_rate=0.0,
            ec2_savings_plan_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            ec2_savings_plan_1_year_partial_upfront_hourly_rate=0.0,
            ec2_savings_plan_1_year_all_upfront_total_cost=0.0,
            ec2_savings_plan_1_year_all_upfront_hourly_rate=0.0,

            # EC2 Savings Plan 3 Year
            ec2_savings_plan_3_year_no_upfront_total_cost=0.0,
            ec2_savings_plan_3_year_no_upfront_hourly_rate=0.0,
            ec2_savings_plan_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            ec2_savings_plan_3_year_partial_upfront_hourly_rate=0.0,
            ec2_savings_plan_3_year_all_upfront_total_cost=0.0,
            ec2_savings_plan_3_year_all_upfront_hourly_rate=0.0,

            # Standard Reserved Instance 1 Year
            standard_reserved_instance_1_year_no_upfront_total_cost=0.0,
            standard_reserved_instance_1_year_no_upfront_hourly_rate=0.0,
            standard_reserved_instance_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            standard_reserved_instance_1_year_partial_upfront_hourly_rate=0.0,
            standard_reserved_instance_1_year_all_upfront_total_cost=0.0,
            standard_reserved_instance_1_year_all_upfront_hourly_rate=0.0,

            # Standard Reserved Instance 3 Year
            standard_reserved_instance_3_year_no_upfront_total_cost=0.0,
            standard_reserved_instance_3_year_no_upfront_hourly_rate=0.0,
            standard_reserved_instance_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
            standard_reserved_instance_3_year_partial_upfront_hourly_rate=0.0,
            standard_reserved_instance_3_year_all_upfront_total_cost=0.0,
            standard_reserved_instance_3_year_all_upfront_hourly_rate=0.0,
        )

def export_to_google_sheets(pricing_results: List[InstancePricingResponse], access_token: str, spreadsheet_title: str) -> Dict[str, Any]:
    """Export pricing results to Google Sheets"""
    try:
        # Create credentials from access token
        creds = google.oauth2.credentials.Credentials(access_token)
        service = googleapiclient.discovery.build('sheets', 'v4', credentials=creds)

        # Create a new spreadsheet
        spreadsheet = {
            'properties': {
                'title': spreadsheet_title
            }
        }
        spreadsheet_result = service.spreadsheets().create(body=spreadsheet).execute()
        spreadsheet_id = spreadsheet_result['spreadsheetId']

        # Prepare data for sheets
        headers = [
            'Region Code', 'Instance Type', 'Operation', 'Operating System', 'Product Tenancy', 'Quantity',
            'On-Demand Hourly Rate', 'On-Demand 1 Year Total Cost', 'On-Demand 3 Year Total Cost',
            'Compute SP 1Y No Upfront Total Cost', 'Compute SP 1Y No Upfront Hourly Rate',
            'Compute SP 1Y Partial Upfront Total Cost', 'Compute SP 1Y Partial Upfront Upfront Fee', 'Compute SP 1Y Partial Upfront Plan Cost', 'Compute SP 1Y Partial Upfront Hourly Rate',
            'Compute SP 1Y All Upfront Total Cost', 'Compute SP 1Y All Upfront Hourly Rate',
            'Compute SP 3Y No Upfront Total Cost', 'Compute SP 3Y No Upfront Hourly Rate',
            'Compute SP 3Y Partial Upfront Total Cost', 'Compute SP 3Y Partial Upfront Upfront Fee', 'Compute SP 3Y Partial Upfront Plan Cost', 'Compute SP 3Y Partial Upfront Hourly Rate',
            'Compute SP 3Y All Upfront Total Cost', 'Compute SP 3Y All Upfront Hourly Rate',
            'EC2 SP 1Y No Upfront Total Cost', 'EC2 SP 1Y No Upfront Hourly Rate',
            'EC2 SP 1Y Partial Upfront Total Cost', 'EC2 SP 1Y Partial Upfront Upfront Fee', 'EC2 SP 1Y Partial Upfront Plan Cost', 'EC2 SP 1Y Partial Upfront Hourly Rate',
            'EC2 SP 1Y All Upfront Total Cost', 'EC2 SP 1Y All Upfront Hourly Rate',
            'EC2 SP 3Y No Upfront Total Cost', 'EC2 SP 3Y No Upfront Hourly Rate',
            'EC2 SP 3Y Partial Upfront Total Cost', 'EC2 SP 3Y Partial Upfront Upfront Fee', 'EC2 SP 3Y Partial Upfront Plan Cost', 'EC2 SP 3Y Partial Upfront Hourly Rate',
            'EC2 SP 3Y All Upfront Total Cost', 'EC2 SP 3Y All Upfront Hourly Rate',
            'RI 1Y No Upfront Total Cost', 'RI 1Y No Upfront Hourly Rate',
            'RI 1Y Partial Upfront Total Cost', 'RI 1Y Partial Upfront Upfront Fee', 'RI 1Y Partial Upfront Plan Cost', 'RI 1Y Partial Upfront Hourly Rate',
            'RI 1Y All Upfront Total Cost', 'RI 1Y All Upfront Hourly Rate',
            'RI 3Y No Upfront Total Cost', 'RI 3Y No Upfront Hourly Rate',
            'RI 3Y Partial Upfront Total Cost', 'RI 3Y Partial Upfront Upfront Fee', 'RI 3Y Partial Upfront Plan Cost', 'RI 3Y Partial Upfront Hourly Rate',
            'RI 3Y All Upfront Total Cost', 'RI 3Y All Upfront Hourly Rate'
        ]

        values = [headers]

        for result in pricing_results:
            row = [
                result.input_data.region_code,
                result.input_data.instance_type,
                result.input_data.operation,
                result.input_data.operating_system,
                result.input_data.product_tenancy,
                result.input_data.qty,
                result.pricing_results.on_demand_hourly_rate,
                result.pricing_results.on_demand_1_year_total_cost,
                result.pricing_results.on_demand_3_year_total_cost,
                result.pricing_results.compute_savings_plan_1_year_no_upfront_total_cost,
                result.pricing_results.compute_savings_plan_1_year_no_upfront_hourly_rate,
                result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.compute_savings_plan_1_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.compute_savings_plan_1_year_partial_upfront_hourly_rate,
                result.pricing_results.compute_savings_plan_1_year_all_upfront_total_cost,
                result.pricing_results.compute_savings_plan_1_year_all_upfront_hourly_rate,
                result.pricing_results.compute_savings_plan_3_year_no_upfront_total_cost,
                result.pricing_results.compute_savings_plan_3_year_no_upfront_hourly_rate,
                result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.compute_savings_plan_3_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.compute_savings_plan_3_year_partial_upfront_hourly_rate,
                result.pricing_results.compute_savings_plan_3_year_all_upfront_total_cost,
                result.pricing_results.compute_savings_plan_3_year_all_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_1_year_no_upfront_total_cost,
                result.pricing_results.ec2_savings_plan_1_year_no_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.ec2_savings_plan_1_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.ec2_savings_plan_1_year_partial_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_1_year_all_upfront_total_cost,
                result.pricing_results.ec2_savings_plan_1_year_all_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_3_year_no_upfront_total_cost,
                result.pricing_results.ec2_savings_plan_3_year_no_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.ec2_savings_plan_3_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.ec2_savings_plan_3_year_partial_upfront_hourly_rate,
                result.pricing_results.ec2_savings_plan_3_year_all_upfront_total_cost,
                result.pricing_results.ec2_savings_plan_3_year_all_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_1_year_no_upfront_total_cost,
                result.pricing_results.standard_reserved_instance_1_year_no_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.standard_reserved_instance_1_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.standard_reserved_instance_1_year_partial_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_1_year_all_upfront_total_cost,
                result.pricing_results.standard_reserved_instance_1_year_all_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_3_year_no_upfront_total_cost,
                result.pricing_results.standard_reserved_instance_3_year_no_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost['total_cost'],
                result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost['upfront_fee'],
                result.pricing_results.standard_reserved_instance_3_year_partial_upfront_total_cost['plan_cost'],
                result.pricing_results.standard_reserved_instance_3_year_partial_upfront_hourly_rate,
                result.pricing_results.standard_reserved_instance_3_year_all_upfront_total_cost,
                result.pricing_results.standard_reserved_instance_3_year_all_upfront_hourly_rate,
            ]
            values.append(row)

        # Write data to the spreadsheet
        range_name = 'A1'
        body = {
            'values': values
        }
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body=body
        ).execute()

        logger.info(f"Successfully exported pricing results to Google Sheets: {spreadsheet_result['spreadsheetUrl']}")
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": spreadsheet_result['spreadsheetUrl'],
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Error exporting to Google Sheets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export to Google Sheets: {str(e)}")

# API Endpoints

@app.post("/price-instance", response_model=InstancePricingResponse)
async def price_instance(instance: EC2InstanceInput):
    """Price a single EC2 instance"""
    try:
        sanitized_instance = sanitize_input(instance.model_dump())
        pricing_results = calculate_pricing(sanitized_instance)
        return InstancePricingResponse(
            input_data=sanitized_instance,
            pricing_results=pricing_results,
            errors=[]
        )
    except Exception as e:
        logger.error(f"Error pricing instance: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")

@app.post("/price-instances", response_model=BulkPricingResponse)
async def price_instances(instances: List[EC2InstanceInput]):
    """Price multiple EC2 instances"""
    try:
        priced_instances = []
        for instance_input in instances:
            try:
                sanitized_instance = sanitize_input(instance_input.model_dump())
                pricing_results = calculate_pricing(sanitized_instance)
                priced_instances.append(InstancePricingResponse(
                    input_data=sanitized_instance,
                    pricing_results=pricing_results,
                    errors=[]
                ))
            except Exception as e:
                # For individual instance errors, include them in the response
                logger.error(f"Error pricing instance {instance_input.instance_type}: {str(e)}")
                sanitized_instance = sanitize_input(instance_input.model_dump())
                priced_instances.append(InstancePricingResponse(
                    input_data=sanitized_instance,
                    pricing_results=PricingResults(
                        on_demand_hourly_rate=0.0,
                        on_demand_1_year_total_cost=0.0,
                        on_demand_3_year_total_cost=0.0,

                        # Compute Savings Plan 1 Year
                        compute_savings_plan_1_year_no_upfront_total_cost=0.0,
                        compute_savings_plan_1_year_no_upfront_hourly_rate=0.0,
                        compute_savings_plan_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        compute_savings_plan_1_year_partial_upfront_hourly_rate=0.0,
                        compute_savings_plan_1_year_all_upfront_total_cost=0.0,
                        compute_savings_plan_1_year_all_upfront_hourly_rate=0.0,

                        # Compute Savings Plan 3 Year
                        compute_savings_plan_3_year_no_upfront_total_cost=0.0,
                        compute_savings_plan_3_year_no_upfront_hourly_rate=0.0,
                        compute_savings_plan_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        compute_savings_plan_3_year_partial_upfront_hourly_rate=0.0,
                        compute_savings_plan_3_year_all_upfront_total_cost=0.0,
                        compute_savings_plan_3_year_all_upfront_hourly_rate=0.0,

                        # EC2 Savings Plan 1 Year
                        ec2_savings_plan_1_year_no_upfront_total_cost=0.0,
                        ec2_savings_plan_1_year_no_upfront_hourly_rate=0.0,
                        ec2_savings_plan_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        ec2_savings_plan_1_year_partial_upfront_hourly_rate=0.0,
                        ec2_savings_plan_1_year_all_upfront_total_cost=0.0,
                        ec2_savings_plan_1_year_all_upfront_hourly_rate=0.0,

                        # EC2 Savings Plan 3 Year
                        ec2_savings_plan_3_year_no_upfront_total_cost=0.0,
                        ec2_savings_plan_3_year_no_upfront_hourly_rate=0.0,
                        ec2_savings_plan_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        ec2_savings_plan_3_year_partial_upfront_hourly_rate=0.0,
                        ec2_savings_plan_3_year_all_upfront_total_cost=0.0,
                        ec2_savings_plan_3_year_all_upfront_hourly_rate=0.0,

                        # Standard Reserved Instance 1 Year
                        standard_reserved_instance_1_year_no_upfront_total_cost=0.0,
                        standard_reserved_instance_1_year_no_upfront_hourly_rate=0.0,
                        standard_reserved_instance_1_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        standard_reserved_instance_1_year_partial_upfront_hourly_rate=0.0,
                        standard_reserved_instance_1_year_all_upfront_total_cost=0.0,
                        standard_reserved_instance_1_year_all_upfront_hourly_rate=0.0,

                        # Standard Reserved Instance 3 Year
                        standard_reserved_instance_3_year_no_upfront_total_cost=0.0,
                        standard_reserved_instance_3_year_no_upfront_hourly_rate=0.0,
                        standard_reserved_instance_3_year_partial_upfront_total_cost={"total_cost": 0.0, "upfront_fee": 0.0, "plan_cost": 0.0},
                        standard_reserved_instance_3_year_partial_upfront_hourly_rate=0.0,
                        standard_reserved_instance_3_year_all_upfront_total_cost=0.0,
                        standard_reserved_instance_3_year_all_upfront_hourly_rate=0.0,
                    ),
                    errors=[str(e)]
                ))
        return BulkPricingResponse(instances=priced_instances)
    except Exception as e:
        logger.error(f"Error in bulk pricing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")

@app.get("/query-pricing-data")
async def query_pricing_data_endpoint(
    region: Optional[str] = None,
    os: Optional[str] = None,
    instance_type: Optional[str] = None,
    instance_family: Optional[str] = None,
    term: Optional[str] = None,
    savings_type: Optional[str] = None
):
    """Query pricing database with filters"""
    try:
        logger.info(f"Query pricing data with filters: region={region}, os={os}, instance_type={instance_type}, "
                   f"instance_family={instance_family}, term={term}, savings_type={savings_type}")

        # Determine which table to query based on savings_type
        if savings_type and savings_type.lower() in ['compute savings plan', 'ec2 savings plan']:
            # Query regional savings plan tables
            if not region:
                raise HTTPException(status_code=400, detail="Region is required for savings plan queries")

            region_code = region.replace('-', '_')
            table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_SAVINGS_PLAN_PREFIX}{region_code}_latest"

            query = f"""
            SELECT
                discountedregioncode as region_code,
                discountedinstancetype as instance_type,
                discountedoperation as operation,
                product_family,
                purchaseoption as purchase_option,
                leasecontractlength as term_years,
                discountedrate as hourly_rate,
                currency,
                unit
            FROM `{table_id}`
            WHERE 1=1
            """

            params = {}
            if savings_type.lower() == 'compute savings plan':
                query += " AND product_family = 'ComputeSavingsPlans'"
            elif savings_type.lower() == 'ec2 savings plan':
                query += " AND product_family = 'EC2InstanceSavingsPlans'"

            if instance_type:
                query += " AND discountedinstancetype = @instance_type"
                params["instance_type"] = instance_type

            if os:
                query += " AND discountedoperation LIKE @operation"
                params["operation"] = f"%{os}%"

            if term:
                if 'year' in term.lower():
                    term_years = term.lower().split('year')[0].strip()
                    query += " AND leasecontractlength = @term_years"
                    params["term_years"] = term_years

        else:
            # Query global pricing table for On-Demand and Reserved Instances
            table_id = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE_EC2_GLOBAL}"

            query = f"""
            SELECT
                region_code,
                instance_type,
                operation,
                operating_system,
                tenancy,
                termtype as term_type,
                purchaseoption as purchase_option,
                leasecontractlength as term_length,
                offeringclass as offering_class,
                priceperunit as price_per_unit,
                unit,
                currency
            FROM `{table_id}`
            WHERE 1=1
            """

            params = {}

            if region:
                query += " AND region_code = @region_code"
                params["region_code"] = region

            if instance_type:
                query += " AND instance_type = @instance_type"
                params["instance_type"] = instance_type

            if os:
                query += " AND operating_system = @operating_system"
                params["operating_system"] = os

            if term:
                if 'reserved' in term.lower():
                    query += " AND termtype LIKE 'Reserved'"
                elif 'on-demand' in term.lower() or 'ondemand' in term.lower():
                    query += " AND termtype = 'OnDemand'"

            if savings_type and 'reserved' in savings_type.lower():
                query += " AND termtype LIKE 'Reserved' AND offeringclass = 'standard'"

        # Add instance family filter if provided
        if instance_family:
            query += " AND instance_type LIKE @instance_family_pattern"
            params["instance_family_pattern"] = f"{instance_family}%"

        # Execute query
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter(key, "STRING", value) for key, value in params.items()]
        )

        query_job = bigquery_client.query(query, job_config=job_config)
        results = [dict(row) for row in query_job]

        logger.info(f"Query returned {len(results)} results")
        return {"results": results, "count": len(results)}

    except Exception as e:
        logger.error(f"Query pricing data failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.post("/export-to-google-sheets")
async def export_to_google_sheets_endpoint(request: GoogleSheetsExportRequest):
    """Export pricing results to Google Sheets"""
    try:
        result = export_to_google_sheets(
            request.pricing_results,
            request.access_token,
            request.spreadsheet_title or "EC2 Pricing Results"
        )
        return result
    except Exception as e:
        logger.error(f"Error in Google Sheets export endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.post("/telemetry")
async def telemetry_endpoint(event: TelemetryEvent):
    """Log telemetry events"""
    try:
        # Log the telemetry event using structured logging
        logger.info(f"Telemetry event: {event.event_type}", extra={
            "event_type": event.event_type,
            "event_data": event.event_data,
            "timestamp": event.timestamp,
            "user_id": event.user_id,
            "session_id": event.session_id
        })
        return {"status": "logged"}
    except Exception as e:
        logger.error(f"Error logging telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log telemetry: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AWS EC2 Pricing API Backend", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)