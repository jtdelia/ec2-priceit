# API Backend

This service is a FastAPI backend that provides endpoints for calculating AWS EC2 instance pricing. It queries a BigQuery database populated by the `pricing-update-job` to retrieve the necessary pricing data.

## Overview

The API exposes endpoints for:

*   **Ad-hoc Pricing**: Calculating costs for a single EC2 instance.
*   **Bulk Pricing**: Processing multiple instances in a single request.
*   **Data Querying**: Filtering and retrieving raw pricing data.

## Setup and Usage

All setup and usage instructions are consolidated in the main [monorepo README.md](../README.md). Please refer to that document for details on:

*   Prerequisites
*   Environment setup
*   Running the application
*   Deployment

## Testing

The test suite uses mocked BigQuery connections and can be run without actual Google Cloud credentials.

To install test dependencies:
```bash
uv sync --extra dev
```

To run all tests:
```bash
uv run pytest tests/ -v
```

For more details on the test architecture and findings, see the [tests/README.md](tests/README.md).

## API Endpoints

The following endpoints are available:

### Health Check

*   **GET /**: Returns the status of the API.

    **Example:**
    ```bash
    curl http://localhost:8000/
    ```

### Pricing

*   **POST /price-instance**: Calculates the pricing for a single EC2 instance.

    **Request Body:**
    ```json
    {
      "region_code": "us-east-1",
      "instance_type": "t2.micro",
      "operation": "RunInstances",
      "operating_system": "Linux",
      "product_tenancy": "Shared",
      "qty": 1
    }
    ```

    **Example:**
    ```bash
    curl -X POST http://localhost:8000/price-instance \
    -H "Content-Type: application/json" \
    -d '{
      "region_code": "us-east-1",
      "instance_type": "t2.micro",
      "operation": "RunInstances",
      "operating_system": "Linux"
    }'
    ```

*   **POST /price-instances**: Calculates the pricing for multiple EC2 instances.

    **Request Body:**
    ```json
    [
      {
        "region_code": "us-east-1",
        "instance_type": "t2.micro",
        "operation": "RunInstances",
        "operating_system": "Linux"
      },
      {
        "region_code": "us-west-2",
        "instance_type": "m5.large",
        "operation": "RunInstances",
        "operating_system": "Windows"
      }
    ]
    ```

    **Example:**
    ```bash
    curl -X POST http://localhost:8000/price-instances \
    -H "Content-Type: application/json" \
    -d '[
      {
        "region_code": "us-east-1",
        "instance_type": "t2.micro",
        "operation": "RunInstances",
        "operating_system": "Linux"
      },
      {
        "region_code": "us-west-2",
        "instance_type": "m5.large",
        "operation": "RunInstances",
        "operating_system": "Windows"
      }
    ]'
    ```

### Data Querying

*   **GET /query-pricing-data**: Queries the pricing database with various filters.

    **Query Parameters:**
    *   `region` (optional): AWS region code (e.g., `us-east-1`).
    *   `os` (optional): Operating system (e.g., `Linux`, `Windows`).
    *   `instance_type` (optional): EC2 instance type (e.g., `t2.micro`).
    *   `instance_family` (optional): EC2 instance family (e.g., `t2`).
    *   `term` (optional): Pricing term (e.g., `OnDemand`, `Reserved`).
    *   `savings_type` (optional): Savings plan type (e.g., `Compute Savings Plan`, `EC2 Savings Plan`).

    **Example:**
    ```bash
    curl "http://localhost:8000/query-pricing-data?region=us-east-1&instance_type=t2.micro"
    ```

### Google Sheets Export

*   **POST /export-to-google-sheets**: Exports pricing results to a Google Sheet.

    **Request Body:**
    ```json
    {
      "pricing_results": [
        {
          "input_data": {
            "region_code": "us-east-1",
            "instance_type": "t2.micro",
            "operation": "RunInstances",
            "operating_system": "Linux",
            "product_tenancy": "Shared",
            "qty": 1
          },
          "pricing_results": { ... }
        }
      ],
      "access_token": "YOUR_GOOGLE_ACCESS_TOKEN",
      "spreadsheet_title": "My EC2 Pricing"
    }
    ```

### Telemetry

*   **POST /telemetry**: Logs telemetry events.

    **Request Body:**
    ```json
    {
      "event_type": "pricing_calculation",
      "event_data": {
        "instance_type": "t2.micro"
      }
    }
    ```