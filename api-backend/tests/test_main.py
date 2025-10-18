"""Tests for the main API backend functionality"""
import pytest
from unittest.mock import patch, MagicMock, Mock
from fastapi.testclient import TestClient


# Mock the BigQuery client and Google Cloud services before importing main
@pytest.fixture(autouse=True)
def mock_bigquery_initialization():
    """Mock BigQuery client initialization at module level"""
    with patch('google.cloud.bigquery.Client') as mock_bq_client, \
         patch('google.auth.default', return_value=(MagicMock(), 'test-project')), \
         patch('google.cloud.logging.Client'), \
         patch('main.setup_cloud_logging'):
        mock_client = MagicMock()
        mock_bq_client.return_value = mock_client
        yield mock_client


@pytest.fixture
def client(mock_bigquery_initialization):
    """Create test client with mocked BigQuery"""
    # Import after mocking to avoid initialization errors
    from main import app
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the health check endpoint"""
    
    def test_root_endpoint(self, client):
        """Test that root endpoint returns health status"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "AWS EC2 Pricing API Backend"
        assert data["status"] == "running"


class TestPriceInstanceEndpoint:
    """Tests for the /price-instance endpoint"""
    
    def test_price_instance_missing_bigquery_data(self, client, sample_instance_input):
        """Test pricing when BigQuery returns no data"""
        with patch('main.query_on_demand_pricing', return_value={}), \
             patch('main.query_reserved_instance_pricing', return_value=[]), \
             patch('main.query_compute_savings_plan_pricing', return_value=[]), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            response = client.post("/price-instance", json=sample_instance_input)
            assert response.status_code == 200
            data = response.json()
            
            # Should return zero costs when no data available
            assert data["pricing_results"]["on_demand_hourly_rate"] == 0.0
            assert data["pricing_results"]["on_demand_1_year_total_cost"] == 0.0
    
    def test_price_instance_with_on_demand_data(self, client, sample_instance_input, mock_on_demand_data):
        """Test pricing calculation with on-demand data"""
        with patch('main.query_on_demand_pricing', return_value=mock_on_demand_data), \
             patch('main.query_reserved_instance_pricing', return_value=[]), \
             patch('main.query_compute_savings_plan_pricing', return_value=[]), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            response = client.post("/price-instance", json=sample_instance_input)
            assert response.status_code == 200
            data = response.json()
            
            # Verify on-demand pricing calculations
            assert data["pricing_results"]["on_demand_hourly_rate"] == 0.10
            # 0.10 * 8760 hours = 876.0
            assert data["pricing_results"]["on_demand_1_year_total_cost"] == 876.0
            # 0.10 * 26280 hours = 2628.0
            assert data["pricing_results"]["on_demand_3_year_total_cost"] == 2628.0
    
    def test_price_instance_invalid_input(self, client):
        """Test that invalid input returns 400 error"""
        invalid_input = {
            "region_code": "us-east-1",
            # Missing required fields
        }
        response = client.post("/price-instance", json=invalid_input)
        assert response.status_code == 422  # Validation error


class TestPriceInstancesEndpoint:
    """Tests for the /price-instances bulk endpoint"""
    
    def test_price_multiple_instances(self, client, sample_instance_input):
        """Test bulk pricing of multiple instances"""
        instances = [
            sample_instance_input,
            {**sample_instance_input, "instance_type": "t3.large"}
        ]
        
        with patch('main.query_on_demand_pricing', return_value={}), \
             patch('main.query_reserved_instance_pricing', return_value=[]), \
             patch('main.query_compute_savings_plan_pricing', return_value=[]), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            response = client.post("/price-instances", json=instances)
            assert response.status_code == 200
            data = response.json()
            
            assert len(data["instances"]) == 2
            assert data["instances"][0]["input_data"]["instance_type"] == "t3.medium"
            assert data["instances"][1]["input_data"]["instance_type"] == "t3.large"
    
    def test_price_instances_with_errors(self, client, sample_instance_input):
        """Test that individual instance errors are captured"""
        instances = [sample_instance_input]
        
        # Simulate an error in pricing calculation
        with patch('main.calculate_pricing', side_effect=Exception("BigQuery error")):
            response = client.post("/price-instances", json=instances)
            assert response.status_code == 200
            data = response.json()
            
            # Should still return response with error captured
            assert len(data["instances"]) == 1
            assert len(data["instances"][0]["errors"]) > 0


class TestQueryPricingDataEndpoint:
    """Tests for the /query-pricing-data endpoint"""
    
    def test_query_on_demand_pricing(self, client):
        """Test querying on-demand pricing data"""
        from main import bigquery_client
        
        # Mock BigQuery query results
        mock_row = {
            'region_code': 'us-east-1',
            'instance_type': 't3.medium',
            'price_per_unit': 0.10
        }
        mock_job = MagicMock()
        mock_job.__iter__ = Mock(return_value=iter([mock_row]))
        
        with patch.object(bigquery_client, 'query', return_value=mock_job):
            response = client.get("/query-pricing-data?region=us-east-1&instance_type=t3.medium")
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert "count" in data
    
    def test_query_savings_plan_without_region(self, client):
        """Test that savings plan query requires region"""
        response = client.get("/query-pricing-data?savings_type=Compute Savings Plan")
        # The endpoint catches HTTPException and re-raises as 500
        assert response.status_code == 500
        assert "Region is required" in response.json()["detail"]


class TestUtilityFunctions:
    """Tests for utility functions"""
    
    def test_sanitize_input(self, sample_instance_input):
        """Test input sanitization"""
        from main import sanitize_input
        
        result = sanitize_input(sample_instance_input)
        assert result.region_code == sample_instance_input["region_code"]
        assert result.instance_type == sample_instance_input["instance_type"]
    
    def test_get_table_name_on_demand(self):
        """Test table name generation for on-demand"""
        from main import get_table_name, BQ_TABLE_EC2_GLOBAL
        
        table_name = get_table_name("On-Demand", "us-east-1")
        assert BQ_TABLE_EC2_GLOBAL in table_name
    
    def test_get_table_name_savings_plan(self):
        """Test table name generation for savings plans"""
        from main import get_table_name, BQ_TABLE_SAVINGS_PLAN_PREFIX
        
        table_name = get_table_name("Compute Savings Plan", "us-east-1")
        assert f"{BQ_TABLE_SAVINGS_PLAN_PREFIX}us_east_1_latest" in table_name
    
    def test_get_table_name_invalid_scenario(self):
        """Test that invalid scenario raises error"""
        from main import get_table_name
        
        with pytest.raises(ValueError, match="Unknown pricing scenario"):
            get_table_name("Invalid Scenario", "us-east-1")


class TestBigQueryQueries:
    """Tests for BigQuery query functions"""
    
    def test_query_on_demand_pricing_success(self, sample_instance_input, mock_on_demand_data):
        """Test successful on-demand pricing query"""
        from main import query_on_demand_pricing, EC2Instance, bigquery_client
        
        # Mock query results
        mock_job = MagicMock()
        mock_job.__iter__ = Mock(return_value=iter([mock_on_demand_data]))
        
        with patch.object(bigquery_client, 'query', return_value=mock_job):
            instance = EC2Instance(**sample_instance_input)
            result = query_on_demand_pricing(instance)
            
            assert result == mock_on_demand_data
            assert bigquery_client.query.called
    
    def test_query_on_demand_pricing_no_results(self, sample_instance_input):
        """Test on-demand pricing query with no results"""
        from main import query_on_demand_pricing, EC2Instance, bigquery_client
        
        # Mock empty results
        mock_job = MagicMock()
        mock_job.__iter__ = Mock(return_value=iter([]))
        
        with patch.object(bigquery_client, 'query', return_value=mock_job):
            instance = EC2Instance(**sample_instance_input)
            result = query_on_demand_pricing(instance)
            
            assert result == {}
    
    def test_query_on_demand_pricing_error(self, sample_instance_input):
        """Test on-demand pricing query with BigQuery error"""
        from main import query_on_demand_pricing, EC2Instance, bigquery_client
        
        # Mock BigQuery error
        with patch.object(bigquery_client, 'query', side_effect=Exception("BigQuery connection failed")):
            instance = EC2Instance(**sample_instance_input)
            result = query_on_demand_pricing(instance)
            
            # Should return empty dict on error
            assert result == {}


class TestPricingCalculations:
    """Tests for pricing calculation logic"""
    
    def test_calculate_pricing_with_all_data(
        self, 
        mock_bigquery_initialization,
        sample_instance_input,
        mock_on_demand_data,
        mock_reserved_instance_data,
        mock_savings_plan_data
    ):
        """Test pricing calculation with complete data"""
        from main import calculate_pricing, EC2Instance
        
        with patch('main.query_on_demand_pricing', return_value=mock_on_demand_data), \
             patch('main.query_reserved_instance_pricing', return_value=mock_reserved_instance_data), \
             patch('main.query_compute_savings_plan_pricing', return_value=mock_savings_plan_data), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            instance = EC2Instance(**sample_instance_input)
            result = calculate_pricing(instance)
            
            # Verify on-demand calculations
            assert result.on_demand_hourly_rate == 0.10
            assert result.on_demand_1_year_total_cost == 876.0
            
            # Verify reserved instance calculations exist
            assert result.standard_reserved_instance_1_year_all_upfront_total_cost > 0
            
            # Verify that all hourly rate fields are present and have valid values
            assert hasattr(result, 'compute_savings_plan_1_year_no_upfront_hourly_rate')
            assert hasattr(result, 'compute_savings_plan_1_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'compute_savings_plan_1_year_all_upfront_hourly_rate')
            assert hasattr(result, 'compute_savings_plan_3_year_no_upfront_hourly_rate')
            assert hasattr(result, 'compute_savings_plan_3_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'compute_savings_plan_3_year_all_upfront_hourly_rate')
            
            assert hasattr(result, 'ec2_savings_plan_1_year_no_upfront_hourly_rate')
            assert hasattr(result, 'ec2_savings_plan_1_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'ec2_savings_plan_1_year_all_upfront_hourly_rate')
            assert hasattr(result, 'ec2_savings_plan_3_year_no_upfront_hourly_rate')
            assert hasattr(result, 'ec2_savings_plan_3_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'ec2_savings_plan_3_year_all_upfront_hourly_rate')
            
            assert hasattr(result, 'standard_reserved_instance_1_year_no_upfront_hourly_rate')
            assert hasattr(result, 'standard_reserved_instance_1_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'standard_reserved_instance_1_year_all_upfront_hourly_rate')
            assert hasattr(result, 'standard_reserved_instance_3_year_no_upfront_hourly_rate')
            assert hasattr(result, 'standard_reserved_instance_3_year_partial_upfront_hourly_rate')
            assert hasattr(result, 'standard_reserved_instance_3_year_all_upfront_hourly_rate')
            
            # Verify savings plan hourly rates match expected values
            assert result.compute_savings_plan_1_year_no_upfront_hourly_rate == 0.08  # From mock data
    
    def test_calculate_pricing_error_handling(self, mock_bigquery_initialization, sample_instance_input):
        """Test that pricing calculation handles errors gracefully"""
        from main import calculate_pricing, EC2Instance
        
        # Simulate error in query
        with patch('main.query_on_demand_pricing', side_effect=Exception("Database error")):
            instance = EC2Instance(**sample_instance_input)
            result = calculate_pricing(instance)
            
            # Should return zero costs on error
            assert result.on_demand_hourly_rate == 0.0
            assert result.on_demand_1_year_total_cost == 0.0
            
            # Verify that all hourly rate fields are zero on error
            assert result.compute_savings_plan_1_year_no_upfront_hourly_rate == 0.0
            assert result.ec2_savings_plan_1_year_no_upfront_hourly_rate == 0.0
            assert result.standard_reserved_instance_1_year_no_upfront_hourly_rate == 0.0


class TestHourlyRateFeature:
    """Tests specifically for the new hourly rate feature"""
    
    def test_api_response_includes_hourly_rates(self, client, sample_instance_input, mock_on_demand_data):
        """Test that API response includes all hourly rate fields"""
        with patch('main.query_on_demand_pricing', return_value=mock_on_demand_data), \
             patch('main.query_reserved_instance_pricing', return_value=[]), \
             patch('main.query_compute_savings_plan_pricing', return_value=[]), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            response = client.post("/price-instance", json=sample_instance_input)
            assert response.status_code == 200
            data = response.json()
            
            pricing_results = data["pricing_results"]
            
            # Verify all hourly rate fields are present in API response
            hourly_rate_fields = [
                "compute_savings_plan_1_year_no_upfront_hourly_rate",
                "compute_savings_plan_1_year_partial_upfront_hourly_rate",
                "compute_savings_plan_1_year_all_upfront_hourly_rate",
                "compute_savings_plan_3_year_no_upfront_hourly_rate",
                "compute_savings_plan_3_year_partial_upfront_hourly_rate",
                "compute_savings_plan_3_year_all_upfront_hourly_rate",
                "ec2_savings_plan_1_year_no_upfront_hourly_rate",
                "ec2_savings_plan_1_year_partial_upfront_hourly_rate",
                "ec2_savings_plan_1_year_all_upfront_hourly_rate",
                "ec2_savings_plan_3_year_no_upfront_hourly_rate",
                "ec2_savings_plan_3_year_partial_upfront_hourly_rate",
                "ec2_savings_plan_3_year_all_upfront_hourly_rate",
                "standard_reserved_instance_1_year_no_upfront_hourly_rate",
                "standard_reserved_instance_1_year_partial_upfront_hourly_rate",
                "standard_reserved_instance_1_year_all_upfront_hourly_rate",
                "standard_reserved_instance_3_year_no_upfront_hourly_rate",
                "standard_reserved_instance_3_year_partial_upfront_hourly_rate",
                "standard_reserved_instance_3_year_all_upfront_hourly_rate"
            ]
            
            for field in hourly_rate_fields:
                assert field in pricing_results, f"Missing hourly rate field: {field}"
                assert isinstance(pricing_results[field], (int, float)), f"Field {field} should be numeric"
    
    def test_bulk_api_includes_hourly_rates(self, client, sample_instance_input):
        """Test that bulk API response includes hourly rate fields"""
        instances = [sample_instance_input]
        
        with patch('main.query_on_demand_pricing', return_value={}), \
             patch('main.query_reserved_instance_pricing', return_value=[]), \
             patch('main.query_compute_savings_plan_pricing', return_value=[]), \
             patch('main.query_ec2_savings_plan_pricing', return_value=[]):
            
            response = client.post("/price-instances", json=instances)
            assert response.status_code == 200
            data = response.json()
            
            pricing_results = data["instances"][0]["pricing_results"]
            
            # Check a few key hourly rate fields are present
            assert "compute_savings_plan_1_year_no_upfront_hourly_rate" in pricing_results
            assert "ec2_savings_plan_1_year_no_upfront_hourly_rate" in pricing_results
            assert "standard_reserved_instance_1_year_no_upfront_hourly_rate" in pricing_results