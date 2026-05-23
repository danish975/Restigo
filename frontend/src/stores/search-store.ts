import { create } from 'zustand';
import { Property } from '@/types/property';

export interface SearchFilters {
  query: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  amenities: string[];
  lat?: number;
  lng?: number;
  radius?: number;
}

interface SearchState {
  filters: SearchFilters;
  results: Property[];
  isLoading: boolean;
  viewMode: 'list' | 'map';
  
  // Actions
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setResults: (results: Property[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setViewMode: (mode: 'list' | 'map') => void;
}

const defaultFilters: SearchFilters = {
  query: '',
  type: '',
  minPrice: 0,
  maxPrice: 10000,
  amenities: [],
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  results: [],
  isLoading: false,
  viewMode: 'list',

  setFilter: (key, value) => set((state) => ({ 
    filters: { ...state.filters, [key]: value } 
  })),
  
  setResults: (results) => set({ results }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
}));
