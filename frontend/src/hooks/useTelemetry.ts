import { useCallback } from "react"
import { api } from "@/lib/api"

// Generate a session ID for the current session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("sessionId")
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("sessionId", sessionId)
  }
  return sessionId
}

// Get user ID (could be from auth context or local storage)
const getUserId = (): string | undefined => {
  // For now, return undefined as we don't have user auth yet
  // This could be extended to get from auth context
  return undefined
}

export const useTelemetry = () => {
  const sessionId = getSessionId()
  const userId = getUserId()

  const trackEvent = useCallback(
    async (eventType: string, eventData: Record<string, unknown>) => {
      try {
        // Send telemetry in the background, don't await
        api.sendTelemetry(eventType, eventData, userId, sessionId).catch((error) => {
          // Silently fail telemetry - don't break the app
          console.warn("Telemetry failed:", error)
        })
      } catch (error) {
        // Silently fail telemetry
        console.warn("Telemetry error:", error)
      }
    },
    [userId, sessionId]
  )

  // Predefined tracking functions for common events
  const trackPageView = useCallback(
    (page: string) => {
      trackEvent("page_view", { page, path: window.location.pathname })
    },
    [trackEvent]
  )

  const trackPricingRequest = useCallback(
    (instanceType: string, region: string, os: string) => {
      trackEvent("pricing_request", {
        instance_type: instanceType,
        region,
        operating_system: os,
      })
    },
    [trackEvent]
  )

  const trackBulkUpload = useCallback(
    (fileCount: number, totalRecords: number) => {
      trackEvent("bulk_upload", {
        file_count: fileCount,
        total_records: totalRecords,
      })
    },
    [trackEvent]
  )

  const trackExport = useCallback(
    (exportType: string, recordCount: number) => {
      trackEvent("export", {
        export_type: exportType,
        record_count: recordCount,
      })
    },
    [trackEvent]
  )

  const trackError = useCallback(
    (errorType: string, errorMessage: string, context?: Record<string, unknown>) => {
      trackEvent("error", {
        error_type: errorType,
        error_message: errorMessage,
        ...context,
      })
    },
    [trackEvent]
  )

  return {
    trackEvent,
    trackPageView,
    trackPricingRequest,
    trackBulkUpload,
    trackExport,
    trackError,
  }
}