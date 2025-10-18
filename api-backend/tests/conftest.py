"""Pytest configuration and fixtures for API backend tests"""
import pytest
from unittest.mock import Mock, MagicMock
from typing import Dict, Any, List


@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Set up environment variables for testing"""
    monkeypatch.setenv("GCP_PROJECT", "test-project")
    monkeypatch.setenv("BIGQUERY_DATASET", "test_dataset")
    monkeypatch.setenv("BIGQUERY_TABLE_EC2_GLOBAL", "test_ec2_global")
    monkeypatch.setenv("BIGQUERY_TABLE_SAVINGS_PLAN_PREFIX", "test_sp_")


@pytest.fixture
def mock_bigquery_client():
    """Mock BigQuery client"""
    mock_client = MagicMock()
    
    # Mock query results
    def mock_query(query_str, job_config=None):
        mock_job = MagicMock()
        mock_job.__iter__ = Mock(return_value=iter([]))
        return mock_job
    
    mock_client.query = mock_query
    return mock_client


@pytest.fixture
def mock_on_demand_data() -> Dict[str, Any]:
    """Sample on-demand pricing data"""
    return {
        'sku': 'TEST-SKU-001',
        'termtype': 'OnDemand',
        'pricedescription': 'USD 0.10 per Hour',
        'priceperunit': '0.10',
        'instance_type': 't3.medium',
        'usagetype': 'BoxUsage:t3.medium',
        'operating_system': 'Linux',
        'unit': 'Hrs'
    }


@pytest.fixture
def mock_reserved_instance_data() -> List[Dict[str, Any]]:
    """Sample reserved instance pricing data"""
    return [
        {
            'sku': 'TEST-RI-001',
            'region_code': 'us-east-1',
            'termtype': 'Reserved',
            'instance_type': 't3.medium',
            'usagetype': 'BoxUsage:t3.medium',
            'operating_system': 'Linux',
            'pricedescription': 'Upfront Fee',
            'priceperunit': '100.00',
            'unit': 'Quantity',
            'currency': 'USD',
            'leasecontractlength': '1yr',
            'purchaseoption': 'All Upfront',
            'offeringclass': 'standard'
        },
        {
            'sku': 'TEST-RI-002',
            'region_code': 'us-east-1',
            'termtype': 'Reserved',
            'instance_type': 't3.medium',
            'usagetype': 'BoxUsage:t3.medium',
            'operating_system': 'Linux',
            'pricedescription': 'USD 0.05 per Hour',
            'priceperunit': '0.05',
            'unit': 'Hrs',
            'currency': 'USD',
            'leasecontractlength': '1yr',
            'purchaseoption': 'No Upfront',
            'offeringclass': 'standard'
        }
    ]


@pytest.fixture
def mock_savings_plan_data() -> List[Dict[str, Any]]:
    """Sample savings plan pricing data"""
    return [
        {
            'sku': 'TEST-SP-001',
            'discountedregioncode': 'us-east-1',
            'discountedinstancetype': 't3.medium',
            'product_family': 'ComputeSavingsPlans',
            'usagetype': 'USE1-BoxUsage:t3.medium',
            'discountedusagetype': 'USE1-BoxUsage:t3.medium',
            'discountedoperation': 'RunInstances',
            'purchaseoption': 'No Upfront',
            'leasecontractlength': '1',
            'leasecontractlengthunit': 'year',
            'discountedrate': '0.08',
            'currency': 'USD',
            'unit': 'Hrs'
        }
    ]


@pytest.fixture
def sample_instance_input() -> Dict[str, Any]:
    """Sample EC2 instance input"""
    return {
        'region_code': 'us-east-1',
        'instance_type': 't3.medium',
        'operation': 'RunInstances',
        'operating_system': 'Linux',
        'product_tenancy': 'Shared',
        'qty': 1
    }