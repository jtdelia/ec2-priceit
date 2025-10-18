# API Backend Test Suite

## Overview

This test suite validates the AWS EC2 Pricing API Backend functionality using mocked BigQuery connections. All tests run without requiring actual Google Cloud credentials or BigQuery access.

## Test Coverage

### ✅ All 17 Tests Passing

The test suite covers:

1. **Health Endpoint** (1 test)
   - Root endpoint returns correct status

2. **Price Instance Endpoint** (3 tests)
   - Handles missing BigQuery data gracefully
   - Calculates pricing correctly with on-demand data
   - Validates input and returns appropriate errors

3. **Bulk Price Instances Endpoint** (2 tests)
   - Processes multiple instances correctly
   - Captures individual instance errors without failing entire request

4. **Query Pricing Data Endpoint** (2 tests)
   - Queries on-demand pricing data successfully
   - Validates that savings plan queries require region parameter

5. **Utility Functions** (4 tests)
   - Input sanitization works correctly
   - Table name generation for different scenarios
   - Error handling for invalid scenarios

6. **BigQuery Query Functions** (3 tests)
   - Successful query execution
   - Handling of empty results
   - Error handling for BigQuery failures

7. **Pricing Calculations** (2 tests)
   - Complete pricing calculation with all data types
   - Graceful error handling returns zero costs

## Running the Tests

### Install Dependencies

```bash
cd api-backend
uv sync --extra dev
```

### Run All Tests

```bash
uv run pytest tests/ -v
```

### Run with Coverage

```bash
uv run pytest tests/ --cov=main --cov-report=html
```

### Run Specific Test Classes

```bash
# Test only health endpoint
uv run pytest tests/test_main.py::TestHealthEndpoint -v

# Test only pricing calculations
uv run pytest tests/test_main.py::TestPricingCalculations -v
```

## Key Findings from Testing

### ✅ What Works

1. **API Endpoints Function Correctly**
   - All three main endpoints (`/`, `/price-instance`, `/price-instances`) work as expected
   - Input validation is properly implemented
   - Error handling returns appropriate status codes

2. **Pricing Calculations Are Accurate**
   - On-demand pricing: `hourly_rate * hours * quantity`
   - 1-year calculation: 8,760 hours (365 days × 24 hours)
   - 3-year calculation: 26,280 hours (3 × 365 days × 24 hours)
   - Reserved Instance and Savings Plan calculations handle different payment options

3. **Error Handling Is Robust**
   - BigQuery connection failures return empty results instead of crashing
   - Individual instance errors in bulk requests don't fail the entire batch
   - Missing data returns zero costs with appropriate error messages

### ⚠️ Issues Discovered

1. **Module-Level BigQuery Initialization**
   - **Issue**: BigQuery client is initialized at module import time (line 49 in main.py)
   - **Impact**: Requires Google Cloud credentials even for testing
   - **Workaround**: Tests mock the initialization before importing the module
   - **Recommendation**: Consider lazy initialization or dependency injection

2. **Error Status Code Inconsistency**
   - **Issue**: `/query-pricing-data` endpoint catches HTTPException(400) and re-raises as 500
   - **Location**: Line 556 raises 400, but line 659 catches and re-raises as 500
   - **Impact**: Client receives 500 Internal Server Error instead of 400 Bad Request
   - **Recommendation**: Let HTTPExceptions propagate without re-catching

3. **No Authentication/Authorization**
   - **Issue**: API endpoints have no authentication
   - **Impact**: Anyone can query pricing data
   - **Recommendation**: Add API key or OAuth authentication for production

4. **Missing Input Validation**
   - **Issue**: No validation for region codes, instance types, etc.
   - **Impact**: Invalid inputs may cause BigQuery errors
   - **Recommendation**: Add enum validation for known regions and instance types

## Test Architecture

### Mocking Strategy

The tests use a comprehensive mocking strategy to avoid external dependencies:

```python
# Mock BigQuery client at module level
@pytest.fixture(autouse=True)
def mock_bigquery_initialization():
    with patch('google.cloud.bigquery.Client') as mock_bq_client, \
         patch('google.auth.default', return_value=(MagicMock(), 'test-project')), \
         patch('google.cloud.logging.Client'), \
         patch('main.setup_cloud_logging'):
        mock_client = MagicMock()
        mock_bq_client.return_value = mock_client
        yield mock_client
```

### Test Data Fixtures

Reusable test data is defined in `conftest.py`:
- `mock_on_demand_data`: Sample on-demand pricing
- `mock_reserved_instance_data`: Sample RI pricing
- `mock_savings_plan_data`: Sample savings plan pricing
- `sample_instance_input`: Valid EC2 instance input

## Recommendations

### High Priority

1. **Fix Error Status Codes**
   - Remove the catch-all exception handler in `/query-pricing-data`
   - Let FastAPI's built-in exception handling work properly

2. **Add Integration Tests**
   - Create tests that use a test BigQuery dataset
   - Validate actual query syntax and results

3. **Add Input Validation**
   - Validate region codes against known AWS regions
   - Validate instance types against known types
   - Add enum types for operation, tenancy, etc.

### Medium Priority

4. **Improve Initialization**
   - Move BigQuery client initialization to app startup event
   - Use dependency injection for better testability

5. **Add Authentication**
   - Implement API key authentication
   - Add rate limiting

6. **Expand Test Coverage**
   - Add tests for edge cases (negative quantities, invalid regions)
   - Add performance tests for bulk operations
   - Add tests for concurrent requests

### Low Priority

7. **Add Monitoring**
   - Add metrics for query performance
   - Track pricing calculation errors
   - Monitor BigQuery quota usage

## Continuous Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    cd api-backend
    uv sync --extra dev
    uv run pytest tests/ -v --cov=main --cov-report=xml
```

## Conclusion

The API backend is **functional and working correctly** for its core purpose of calculating EC2 pricing. The test suite validates all major functionality and error handling paths. The main issues are architectural (module-level initialization) and operational (error status codes, missing auth) rather than functional bugs.

**Status**: ✅ Ready for development use with recommended improvements for production deployment.