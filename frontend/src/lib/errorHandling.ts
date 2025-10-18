import { ApiError } from "./api"

/**
 * Standardized error handling utility for API errors
 * Displays appropriate toast messages and logs errors
 */
export function handleApiError(error: unknown, context?: string): void {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error)

  if (error instanceof ApiError) {
    // API errors are already handled by the hooks with toast
    return
  }

  // For other errors, you could add additional handling here
  // For now, just log them as they should be handled by the calling code
}

/**
 * Utility to get user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}