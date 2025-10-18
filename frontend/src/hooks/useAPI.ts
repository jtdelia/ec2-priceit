import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type {
  EC2InstanceInput,
  PricingDataFilters,
} from "@/types/api"

/**
 * Hook to price a single EC2 instance
 */
export function usePriceInstance() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (instance: EC2InstanceInput) => api.priceInstance(instance),
    onError: (error) => {
      console.error("Failed to price instance:", error)
      toast({
        title: "Pricing Error",
        description: error instanceof Error ? error.message : "Failed to price instance",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to price multiple EC2 instances (bulk)
 */
export function usePriceInstances() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (instances: EC2InstanceInput[]) =>
      api.priceInstances(instances),
    onError: (error) => {
      console.error("Failed to price instances:", error)
      toast({
        title: "Bulk Pricing Error",
        description: error instanceof Error ? error.message : "Failed to price instances",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to query pricing data with filters
 */
export function useQueryPricingData(filters: PricingDataFilters) {
  return useQuery({
    queryKey: ["pricing-data", filters],
    queryFn: () => api.queryPricingData(filters),
    enabled: Object.keys(filters).length > 0, // Only run if filters are provided
  })
}

/**
 * Hook to check API health status
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.healthCheck(),
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
  })
}