# EC2 PriceIt

## AWS EC2 Cost Optimization Application

A  web application for AWS EC2 cost optimization analysis, featuring bulk pricing calculations, ad-hoc queries, and export capabilities to CSV, Excel, and Google Sheets.  EC2 PriceIt grabs EC2 on-demand, reserved instance and savings plans pricing from AWS on a period basis by downloading pricing files.  Pricing data is stored on Google Cloud BigQuery.  An API Backend and Frontend components are hosted on Google Cloud Run.

I built this as AWS doesn't provide any good tools to price out EC2 instances and easily compare TCO scenarios between all the different options such as On-Demand, Reserved Instances, Compute Savings Plans and EC2 Savings Plans...over 1 or 3 year terms.

## Architecture

This is a monorepo containing three main components:

- **`pricing-update-job/`** - Cloud job that downloads and processes AWS pricing data into BigQuery
- **`api-backend/`** - FastAPI backend providing pricing calculation endpoints
- **`frontend/`** - React-based web interface for cost analysis and visualization

## Features

- **Bulk Pricing Analysis** - Upload CSV/Excel files with multiple EC2 instances
- **Ad-hoc Pricing** - Quick pricing queries for individual instances
- **Interactive Dashboard** - Visualize cost comparisons across 24 pricing scenarios
- **Export Options** - Download results as CSV, Excel, or Google Sheets
- **Google Sheets Integration** - Direct export to Google Sheets (requires OAuth setup)

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- Google Cloud Project with BigQuery access
- Google OAuth credentials (for Google Sheets export)

### 1. Clone and Setup

```bash
git clone https://github.com/jtdelia/ec2-priceit.git
cd ec2-priceit
```

### 2. Backend Setup

```bash
cd api-backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env with your GCP project settings
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your OAuth client ID
```

### 3. Pricing Update Job Setup

This job is responsible for downloading and processing AWS pricing data into BigQuery. The backend relies on this data to perform pricing calculations.

```bash
cd ../pricing-update-job

# Configure environment
cp .env.example .env
# Edit .env with your GCS bucket and BigQuery settings
```

See the [Pricing Update Job README](pricing-update-job/README.md) for detailed instructions on running the job.

### 4. Google OAuth Configuration

To enable Google Sheets export functionality, you need to set up Google OAuth:

#### 1. Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it

#### 2. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Select "Web application" as application type
5. Add authorized redirect URIs:
   - For development: `http://localhost:5173`
   - For production: Your deployed frontend URL
6. Copy the Client ID

#### 3. Configure Environment Variables

**Frontend (.env):**
```bash
VITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id_here
```

**Backend (.env):**
```bash
# No additional configuration needed - OAuth tokens are handled client-side
```

#### 4. OAuth Scopes Required

The application requests the following OAuth scopes:
- `https://www.googleapis.com/auth/spreadsheets` - Create and modify Google Sheets
- `https://www.googleapis.com/auth/userinfo.email` - Access user email
- `https://www.googleapis.com/auth/userinfo.profile` - Access basic profile info

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd api-backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start frontend
cd ../frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Google Sheets Export Flow

1. User clicks "Export to Google Sheets" in the dashboard
2. If not authenticated, user is prompted to connect Google account
3. OAuth flow redirects to Google for authorization
4. Upon successful authentication, export proceeds
5. New Google Sheet is created with pricing data
6. User is redirected to view the exported spreadsheet

## Environment Variables

### Backend (api-backend/.env)

```bash
# Google Cloud Configuration
GCP_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# BigQuery Configuration
BIGQUERY_DATASET=ec2_pricing_files
BIGQUERY_TABLE_EC2_GLOBAL=ec2_global_pricing_latest
BIGQUERY_TABLE_SAVINGS_PLAN_PREFIX=savings_plan_
```

### Frontend (frontend/.env)

```bash
# API Configuration
VITE_BACKEND_API_URL=http://localhost:8000

# OAuth Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
```

## Development

See individual component READMEs for detailed development instructions:
- [Frontend README](frontend/README.md)
- [Backend README](api-backend/README.md)
- [Pricing Update Job README](pricing-update-job/README.md)

## Deployment

Each component can be deployed independently:

- **Backend**: Cloud Run with service account for BigQuery access
- **Frontend**: Cloud Run or static hosting
- **Pricing Job**: Cloud Run scheduled job

See `Makefile`s in each component directory for deployment commands.

## License

MIT License

Copyright (c) [2025]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.