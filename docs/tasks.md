# Development Tasks

This document contains the detailed todo list for building the Backend API and Frontend components of the AWS EC2 Cost Optimization application.

## Phase 1: Backend API Development

*   **Goal**: Implement the core pricing logic and API endpoints.
*   **Dependencies**: BigQuery pricing data (already handled by `pricing-update-job`).

1.  **Backend API: Setup and Core Logic**
    1.1. [x] Configure `api-backend` for Google Cloud service account authentication to BigQuery.
    1.2. [x] Implement a BigQuery client in `api-backend/main.py` to query pricing data.
    1.3. [x] Create a data model (e.g., Pydantic models) for input EC2 instances based on the defined JSON structure.
    1.4. [x] Create a data model for the output pricing results, including all specified pricing scenarios, with the breakdown for partial upfront costs.
    1.5. [x] Implement a utility function to sanitize and map input instance data to BigQuery query parameters, handling the `QTY` renaming and `Value` dropping.
    1.6. [x] Implement the core pricing logic to query BigQuery for On-Demand, Compute Savings Plan, EC2 Savings Plan, and Reserved Instance pricing. Handle dynamic table naming for Savings Plans (e.g., `savings_plan_{region_code}_latest`).
1.6.1. [x] Define BigQuery queries for each pricing scenario based on `examples/how-to-match-pricing.md`: On-Demand, Reserved Instance, Compute Savings Plan, EC2 Savings Plan.
1.6.2. [x] Implement calculation of upfront fees and plan costs for partial and all upfront Savings Plans (upfront_fee = 50% of TCO for partial, 100% for all upfront; plan_cost = remaining portion).
    1.7. [x] Calculate all 24 pricing scenarios for a given EC2 instance, including the breakdown of upfront fee and plan cost for partial upfront options.
    1.8. [x] Implement robust error handling and logging using Google Cloud best practices (e.g., structured logging).
    1.9. [x] **FEATURE ENHANCEMENT**: Add hourly rate fields to all pricing scenarios in API responses (18 new fields total).
        1.9.1. [x] Update PricingResults Pydantic model with hourly rate fields for all scenarios.
        1.9.2. [x] Modify pricing calculation logic to compute and populate hourly rates.
        1.9.3. [x] Update error handling to include default hourly rate values.
        1.9.4. [x] Add comprehensive tests for hourly rate functionality.
        1.9.5. [x] Create test plan and documentation for the new feature.

2.  **Backend API: Endpoints**
    2.1. [x] Create a `/price-instance` endpoint (POST) that accepts a single EC2 instance JSON object and returns its pricing.
    2.2. [x] Create a `/price-instances` endpoint (POST) that accepts a list of EC2 instance JSON objects and returns a list of priced instances.
    2.3. [x] Create a `/query-pricing-data` endpoint (GET/POST) that accepts filter parameters (region, OS type, instance type, instance family, term, savings type) and returns matching pricing scenarios.

3.  **Backend API: Deployment Preparation**
    3.1. [x] Create a `Dockerfile` for the `api-backend` application.
    3.2. [x] Update `pyproject.toml` with necessary dependencies (e.g., `google-cloud-bigquery`).
    3.3. [x] Create a `Makefile` for deploying the `api-backend` to Cloud Run, similar to `pricing-update-job/Makefile`.
    3.4. [x] Define IAM roles and service accounts for the `api-backend` Cloud Run service to access BigQuery.

## Phase 2: Frontend Development

*   **Goal**: Build a sleek, modern, and performant user interface for cloud architects to perform EC2 cost optimization analysis.
*   **Dependencies**: Completed and deployed Backend API.
*   **Core Technologies**: React, Vite, TypeScript, Shadcn UI, React Query.

4.  **Frontend: Project Scaffolding & Core Setup**
    4.1. [x] Initialize a new React + Vite project with the TypeScript template in the `frontend` directory.
    4.2. [x] Install and configure Shadcn UI, including setting up `tailwind.config.js` and `globals.css`.
    4.3. [x] Define application layout with a persistent sidebar and header using Shadcn `Layout` patterns.
    4.4. [x] Implement primary navigation (`Dashboard`, `Bulk Upload`, `Ad-hoc Pricing`, `Explorer`, `Activity`, `Settings`).
    4.5. [x] Set up React Query client and provider for server state management.
    4.6. [x] Create a centralized, typed API client in `frontend/src/lib/api.ts` to interact with all backend endpoints.

5.  **Frontend: Authentication & Authorization**
    5.1. [x] Implement a dedicated `AuthContext` to manage user authentication state and OAuth tokens.
    5.2. [x] Create a settings page for users to connect their Google Account via OAuth for Google Sheets integration.
    5.3. [x] Implement logic to securely store, retrieve, and refresh OAuth tokens.
    5.4. [x] Build UI components (`Dialog`, `Alert`) to handle re-authentication prompts.

6.  **Frontend: Bulk Pricing Journey (File Upload)**
    6.1. [x] Develop a `FileUpload` component supporting drag-and-drop for CSV/Excel files.
    6.2. [x] Provide a downloadable blank CSV template.
    6.3. [x] Implement client-side file parsing (e.g., using `papaparse`) and display a pre-submission data preview.
    6.4. [x] Use React Query's `useMutation` to send parsed data to the `/price-instances` endpoint, with clear loading and progress indicators (`Progress`, `Spinner`).
    6.5. [x] On success, navigate to the dashboard view populated with the results.

7.  **Frontend: Ad-hoc Pricing Journey**
    7.1. [x] Create a form-based "Ad-hoc Pricing Console" using Shadcn `Form`, `Select`, `Combobox`, and `Input` components.
    7.2. [x] Implement a `useMutation` hook to call the `/price-instance` endpoint.
    7.3. [x] Display results in a clear, concise format using `Card` and `Badge` components.
    7.4. [x] For each pricing scenario, display the discount percentage relative to the on-demand price.

8.  **Frontend: Dashboard & Visualization**
    8.1. [x] Design the main dashboard layout using a grid of `Card` components for summary metrics.
    8.2. [x] Implement a powerful `DataTable` (using `@tanstack/react-table`) to display detailed pricing results.
    8.3. [x] Integrate a charting library (e.g., Recharts) to visualize TCO comparisons (Bar chart) and cumulative savings (Line chart).
    8.4. [x] Develop a `Filter` component panel with `ToggleGroup`, `Checkbox`, and `Select` to filter the dashboard results by plan type, term, OS, etc.
    8.5. [x] Implement `Skeleton` loading states for all dashboard components.

9.  **Frontend: Export & Sharing**
     9.1. [x] Add an "Export" `DropdownMenu` to the dashboard and results tables.
    9.2. [x] Implement export-to-CSV functionality.
    9.3. [x] Implement export-to-Excel functionality (e.g., using `xlsx` library).
    9.4. [x] Implement "Export to Google Sheets" flow, checking for OAuth credentials and triggering the backend process.
    9.5. [x] Display export status and history in the "Activity and Exports Log" page.

10. **Frontend: General UX, Error Handling, and Accessibility**
     10.1. [x] Implement standardized error display using Shadcn `Alert` and `Toast` for API and client-side errors.
     10.2. [x] Ensure all interactive elements are fully keyboard accessible and meet WCAG AA contrast standards.
     10.3. [x] Use ARIA attributes and provide visually hidden labels where necessary.
     10.4. [x] Implement a "reduced motion" mode.
     10.5. [x] Set up console logging for pricing and export activities
     10.6. [x] Add a setting for dark/light mode for the frontend

11. **Frontend: Deployment**
    11.1. [x] Create a multi-stage `Dockerfile` for building and serving the production React app.
    11.2. [x] Update `package.json` with all required dependencies.
    11.3. [x] Create a `Makefile` with commands to build, test, and deploy the frontend service to Cloud Run.
    11.4. [x] Create a .env template to configure the service
    11.5. [x] Configure Cloud Run service with environment variables (`VITE_BACKEND_API_URL`, `VITE_GOOGLE_OAUTH_CLIENT_ID`).
    11.6. [x] Review the frontend code and update the README.md to be current