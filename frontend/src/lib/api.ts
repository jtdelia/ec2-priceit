import type {
  EC2InstanceInput,
  PricingResponse,
  PricingDataFilters,
} from "@/types/api"

// Type for FastAPI validation errors
interface FastAPIValidationError {
  loc: string[]
  msg: string
  type: string
}

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000"
console.log('API_BASE_URL:', API_BASE_URL)
console.log('VITE_BACKEND_API_URL:', import.meta.env.VITE_BACKEND_API_URL)

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const method = options?.method || 'GET'

  console.log(`[API] ${method} ${url}`, {
    headers: options?.headers,
    body: options?.body ? JSON.parse(options.body as string) : undefined,
  })

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    console.log(`[API] Response ${response.status} for ${method} ${url}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorDetails: unknown

      try {
        const errorData = await response.json()
        console.error(`[API] Error response for ${method} ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries()),
        })
        if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors
          errorMessage = errorData.detail.map((err: FastAPIValidationError) => `${err.loc.join('.')}: ${err.msg}`).join('; ')
        } else {
          errorMessage = errorData.detail || errorMessage
        }
        errorDetails = errorData
      } catch (parseError) {
        console.error(`[API] Failed to parse error response for ${method} ${url}:`, parseError)
        // If JSON parsing fails, use the default error message
      }

      console.error(`[API] Throwing ApiError for ${method} ${url}:`, errorMessage)
      throw new ApiError(errorMessage, response.status, errorDetails)
    }

    const data = await response.json()
    console.log(`[API] Success response for ${method} ${url}:`, data)
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    console.error(`[API] Network/other error for ${method} ${url}:`, error)
    throw new ApiError(
      error instanceof Error ? error.message : "An unknown error occurred"
    )
  }
}

// API client object with all endpoint methods
export const api = {
  /**
   * Price a single EC2 instance
   * POST /price-instance
   */
  priceInstance: async (
    instance: EC2InstanceInput
  ): Promise<PricingResponse> => {
    return fetchAPI<PricingResponse>("/price-instance", {
      method: "POST",
      body: JSON.stringify(instance),
    })
  },

  /**
   * Price multiple EC2 instances (bulk)
   * POST /price-instances
   */
  priceInstances: async (
    instances: EC2InstanceInput[]
  ): Promise<PricingResponse[]> => {
    const data = await fetchAPI<{ instances: PricingResponse[] }>("/price-instances", {
      method: "POST",
      body: JSON.stringify(instances),
    })
    return data.instances
  },

  /**
   * Query pricing data with filters
   * POST /query-pricing-data
   */
  queryPricingData: async (
    filters: PricingDataFilters
  ): Promise<unknown> => {
    return fetchAPI<unknown>("/query-pricing-data", {
      method: "POST",
      body: JSON.stringify(filters),
    })
  },

  /**
   * Export pricing results to Google Sheets
   * POST /export-to-google-sheets
   */
  exportToGoogleSheets: async (
    pricingResults: PricingResponse[],
    accessToken: string,
    spreadsheetTitle?: string
  ): Promise<{ spreadsheet_id: string; spreadsheet_url: string; status: string }> => {
    return fetchAPI<{ spreadsheet_id: string; spreadsheet_url: string; status: string }>("/export-to-google-sheets", {
      method: "POST",
      body: JSON.stringify({
        pricing_results: pricingResults,
        access_token: accessToken,
        spreadsheet_title: spreadsheetTitle,
      }),
    })
  },

  /**
   * Send telemetry event
   * POST /telemetry
   */
  sendTelemetry: async (
    eventType: string,
    eventData: Record<string, unknown>,
    userId?: string,
    sessionId?: string
  ): Promise<{ status: string }> => {
    return fetchAPI<{ status: string }>("/telemetry", {
      method: "POST",
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString(),
        user_id: userId,
        session_id: sessionId,
      }),
    })
  },

  /**
   * Health check endpoint
   * GET /health or /
   */
  healthCheck: async (): Promise<{ status: string }> => {
    return fetchAPI<{ status: string }>("/health")
  },
}

// Export the API base URL for reference
export { API_BASE_URL }