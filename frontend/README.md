# AWS EC2 Cost Optimizer - Frontend

A modern, React-based web application for AWS EC2 cost optimization analysis, built with Vite and TypeScript. This application allows cloud architects to perform cost analysis for EC2 instances across different pricing models including On-Demand, Reserved Instances, and Savings Plans.

## Technology Stack

- **React 18.3** - UI library with hooks
- **Vite 6.0** - Build tool and development server
- **TypeScript 5.6** - Type safety
- **Shadcn UI** - Modern UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Query (TanStack Query)** - Server state management
- **React Router** - Client-side routing
- **React Hook Form** - Form state management
- **Recharts** - Charting library for data visualization
- **Papaparse** - CSV parsing for bulk uploads
- **XLSX** - Excel file handling
- **ESLint** - Code linting
- **Nginx** - Production web server

## Features

- **Dashboard**: Overview of pricing analysis with charts and metrics
- **Bulk Upload**: CSV/Excel file upload for batch pricing analysis
- **Ad-hoc Pricing**: Single instance pricing calculator
- **Pricing Explorer**: Advanced filtering and exploration of pricing data
- **Export**: CSV, Excel, and Google Sheets export functionality
- **Authentication**: Google OAuth integration for Google Sheets export
- **Dark/Light Mode**: Theme switching
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: WCAG AA compliant

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project (for OAuth and deployment)

### Installation

```bash
# Install dependencies
npm install
```

### Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `VITE_BACKEND_API_URL`: URL of the deployed backend API
- `VITE_GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID for Sheets integration

## Google OAuth Setup

To enable Google Sheets export functionality, you need to configure OAuth 2.0 credentials in the Google Cloud Console. This process ensures that the application has the necessary permissions to access Google Sheets on behalf of the user.

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

### 2. Enable Required APIs

Enable the following APIs in your Google Cloud project:
- Google Sheets API

### 3. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen".
2. Choose "External" as the user type.
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Add the following scope: `https://www.googleapis.com/auth/spreadsheets`
5. Save the configuration.

### 4. Create OAuth 2.0 Client ID

1. Go to "APIs & Services" > "Credentials".
2. Click "Create Credentials" > "OAuth client ID".
3. Select "Web application" as the application type.
4. Add the following authorized JavaScript origins:
   - For development: `http://localhost:5173`
5. Add the following authorized redirect URIs:
   - For development: `http://localhost:5173`
   - For production: `https://your-cloud-run-service-url` (replace with your actual Cloud Run URL)
6. Click "Create" and copy the generated Client ID.

### 5. Configure Environment Variables

Set the `VITE_GOOGLE_OAUTH_CLIENT_ID` environment variable in your `.env` file with the Client ID obtained from the previous step.

For production deployments, ensure the authorized redirect URI in Google Cloud matches your Cloud Run service URL.

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

```bash
# Build for production
npm run build
```

### Testing

```bash
# Run tests
npm test
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Deployment

The application is configured for deployment to Google Cloud Run.

### Prerequisites

- Google Cloud SDK installed and authenticated
- Artifact Registry API enabled
- Cloud Run API enabled

### Environment Variables

Set the following environment variables or create a `.env` file:

```bash
export GCP_PROJECT=your-gcp-project-id
export GCP_REGION=us-central1
export VITE_BACKEND_API_URL=https://your-backend-api-url
export VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
```

### Deploy

```bash
# Full deployment (enables APIs, creates repo, builds and deploys)
make deploy

# Individual commands
make enable-apis    # Enable required GCP APIs
make create-repo    # Create Artifact Registry repository
make push          # Build and push Docker image
make create-service # Create Cloud Run service
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── auth/           # Authentication components
│   │   ├── bulk-upload/    # File upload components
│   │   ├── layout/         # Layout components (sidebar, header)
│   │   ├── pricing/        # Pricing-related components
│   │   └── ...
│   ├── context/            # React contexts (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities (API client, utils)
│   ├── pages/              # Page components
│   ├── store/              # State management (Zustand)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── Dockerfile              # Multi-stage Docker build
├── Makefile                # Deployment automation
├── .env.example            # Environment template
├── package.json            # Project dependencies
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── eslint.config.js        # ESLint configuration
```

## Development Status

The frontend application is fully implemented with all planned features completed. See [`docs/tasks.md`](../docs/tasks.md) for the detailed development roadmap and current status.