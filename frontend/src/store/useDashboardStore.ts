import { create } from 'zustand';
import { PricingResponse } from '@/types/api';

interface DashboardState {
  results: PricingResponse[];
  error: string | null;
  setResults: (results: PricingResponse[], error?: string | null) => void;
  fileName: string;
  loading: boolean;
  setFileName: (fileName: string) => void;
  setLoading: (loading: boolean) => void;
  filters: {
    planType: string;
    term: string;
    os: string[];
  };
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  results: [],
  error: null,
  setResults: (results: PricingResponse[], error = null) => set({ results, error }),
  fileName: "",
  loading: false,
  setFileName: (fileName: string) => set({ fileName }),
  setLoading: (loading: boolean) => set({ loading }),
  filters: {
    planType: "all",
    term: "all",
    os: ["linux", "windows"],
  },
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
}));