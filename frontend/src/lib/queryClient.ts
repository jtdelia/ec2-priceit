import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds after data is considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Time in milliseconds for cache to live
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests
      retry: 1,
      
      // Retry delay in milliseconds
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 0,
      
      // Error handling
      onError: (error) => {
        console.error("Mutation error:", error)
      },
    },
  },
})