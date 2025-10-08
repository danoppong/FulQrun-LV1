// src/contexts/FilterContext.tsx
// Global filter context for dashboard-wide filter management
// Provides centralized filter state across all dashboard components

'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { 
  FilterState, 
  ActiveFilter, 
  FilterGroup, 
  FilterActions, 
  FilterPreset, 
  FilterExport,
  FilterType 
} from '@/lib/types/filters';

interface FilterContextValue {
  state: FilterState;
  actions: FilterActions;
  filterGroups: FilterGroup[];
}

type FilterAction =
  | { type: 'ADD_FILTER'; payload: { groupId: string; optionId: string } }
  | { type: 'REMOVE_FILTER'; payload: { groupId: string; optionId: string } }
  | { type: 'SET_FILTER_OPTIONS'; payload: { groupId: string; optionIds: string[] } }
  | { type: 'CLEAR_FILTER'; payload: { groupId: string } }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_SEARCH_TERM'; payload: { groupId: string; term: string } }
  | { type: 'CLEAR_SEARCH_TERM'; payload: { groupId: string } }
  | { type: 'SET_FILTER_OPERATOR'; payload: { groupId: string; operator: 'AND' | 'OR' } }
  | { type: 'APPLY_FILTER_PRESET'; payload: FilterPreset }
  | { type: 'IMPORT_FILTERS'; payload: FilterExport }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAST_UPDATED' };

const initialState: FilterState = {
  activeFilters: [],
  searchTerms: {},
  isLoading: false,
  lastUpdated: null,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'ADD_FILTER': {
      const { groupId, optionId } = action.payload;
      const existingFilter = state.activeFilters.find(filter => filter.groupId === groupId);
      
      if (existingFilter) {
        // Add to existing filter
        if (!existingFilter.optionIds.includes(optionId)) {
          return {
            ...state,
            activeFilters: state.activeFilters.map(filter =>
              filter.groupId === groupId
                ? { ...filter, optionIds: [...filter.optionIds, optionId] }
                : filter
            ),
            lastUpdated: new Date(),
          };
        }
        return state;
      } else {
        // Create new filter
        const newFilter: ActiveFilter = {
          groupId,
          optionIds: [optionId],
          type: 'custom', // Will be updated based on filter group
          operator: 'OR',
        };
        return {
          ...state,
          activeFilters: [...state.activeFilters, newFilter],
          lastUpdated: new Date(),
        };
      }
    }

    case 'REMOVE_FILTER': {
      const { groupId, optionId } = action.payload;
      return {
        ...state,
        activeFilters: state.activeFilters
          .map(filter =>
            filter.groupId === groupId
              ? { ...filter, optionIds: filter.optionIds.filter(id => id !== optionId) }
              : filter
          )
          .filter(filter => filter.optionIds.length > 0),
        lastUpdated: new Date(),
      };
    }

    case 'SET_FILTER_OPTIONS': {
      const { groupId, optionIds } = action.payload;
      
      if (optionIds.length === 0) {
        // Remove filter if no options selected
        return {
          ...state,
          activeFilters: state.activeFilters.filter(filter => filter.groupId !== groupId),
          lastUpdated: new Date(),
        };
      }

      const existingFilter = state.activeFilters.find(filter => filter.groupId === groupId);
      
      if (existingFilter) {
        // Update existing filter
        return {
          ...state,
          activeFilters: state.activeFilters.map(filter =>
            filter.groupId === groupId
              ? { ...filter, optionIds }
              : filter
          ),
          lastUpdated: new Date(),
        };
      } else {
        // Create new filter
        const newFilter: ActiveFilter = {
          groupId,
          optionIds,
          type: 'custom',
          operator: 'OR',
        };
        return {
          ...state,
          activeFilters: [...state.activeFilters, newFilter],
          lastUpdated: new Date(),
        };
      }
    }

    case 'CLEAR_FILTER': {
      const { groupId } = action.payload;
      return {
        ...state,
        activeFilters: state.activeFilters.filter(filter => filter.groupId !== groupId),
        lastUpdated: new Date(),
      };
    }

    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        activeFilters: [],
        searchTerms: {},
        lastUpdated: new Date(),
      };

    case 'SET_SEARCH_TERM': {
      const { groupId, term } = action.payload;
      return {
        ...state,
        searchTerms: {
          ...state.searchTerms,
          [groupId]: term,
        },
      };
    }

    case 'CLEAR_SEARCH_TERM': {
      const { groupId } = action.payload;
      const newSearchTerms = { ...state.searchTerms };
      delete newSearchTerms[groupId];
      return {
        ...state,
        searchTerms: newSearchTerms,
      };
    }

    case 'SET_FILTER_OPERATOR': {
      const { groupId, operator } = action.payload;
      return {
        ...state,
        activeFilters: state.activeFilters.map(filter =>
          filter.groupId === groupId
            ? { ...filter, operator }
            : filter
        ),
        lastUpdated: new Date(),
      };
    }

    case 'APPLY_FILTER_PRESET': {
      const preset = action.payload;
      return {
        ...state,
        activeFilters: preset.filters,
        searchTerms: {},
        lastUpdated: new Date(),
      };
    }

    case 'IMPORT_FILTERS': {
      const filterExport = action.payload;
      return {
        ...state,
        activeFilters: filterExport.filters,
        searchTerms: {},
        lastUpdated: new Date(),
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'UPDATE_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: new Date(),
      };

    default:
      return state;
  }
}

const FilterContext = createContext<FilterContextValue | null>(null);

interface FilterProviderProps {
  children: ReactNode;
  filterGroups: FilterGroup[];
}

export function FilterProvider({ children, filterGroups }: FilterProviderProps) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Update filter types based on filter groups
  const updateFilterTypes = useCallback((filters: ActiveFilter[]): ActiveFilter[] => {
    return filters.map(filter => {
      const group = filterGroups.find(g => g.id === filter.groupId);
      return group ? { ...filter, type: group.type } : filter;
    });
  }, [filterGroups]);

  const actions: FilterActions = React.useMemo(() => ({
    addFilter: (groupId: string, optionId: string) => {
      dispatch({ type: 'ADD_FILTER', payload: { groupId, optionId } });
    },

    removeFilter: (groupId: string, optionId: string) => {
      dispatch({ type: 'REMOVE_FILTER', payload: { groupId, optionId } });
    },

    clearFilter: (groupId: string) => {
      dispatch({ type: 'CLEAR_FILTER', payload: { groupId } });
    },

    clearAllFilters: () => {
      dispatch({ type: 'CLEAR_ALL_FILTERS' });
    },

    setFilterOptions: (groupId: string, optionIds: string[]) => {
      dispatch({ type: 'SET_FILTER_OPTIONS', payload: { groupId, optionIds } });
    },

    toggleFilterOption: (groupId: string, optionId: string) => {
      const existingFilter = state.activeFilters.find(filter => filter.groupId === groupId);
      if (existingFilter?.optionIds.includes(optionId)) {
        dispatch({ type: 'REMOVE_FILTER', payload: { groupId, optionId } });
      } else {
        dispatch({ type: 'ADD_FILTER', payload: { groupId, optionId } });
      }
    },

    setSearchTerm: (groupId: string, term: string) => {
      dispatch({ type: 'SET_SEARCH_TERM', payload: { groupId, term } });
    },

    clearSearchTerm: (groupId: string) => {
      dispatch({ type: 'CLEAR_SEARCH_TERM', payload: { groupId } });
    },

    setFilterOperator: (groupId: string, operator: 'AND' | 'OR') => {
      dispatch({ type: 'SET_FILTER_OPERATOR', payload: { groupId, operator } });
    },

    collapseFilterGroup: (_groupId: string, _collapsed: boolean) => {
      // This would be handled by individual filter components
      // Could be extended to manage global collapse state
    },

    applyFilterPreset: (preset: FilterPreset) => {
      dispatch({ type: 'APPLY_FILTER_PRESET', payload: preset });
    },

    exportFilters: (): FilterExport => {
      return {
        version: '1.0',
        timestamp: new Date(),
        filters: updateFilterTypes(state.activeFilters),
      };
    },

    importFilters: (filters: FilterExport) => {
      dispatch({ type: 'IMPORT_FILTERS', payload: filters });
    },
  }), [state.activeFilters, updateFilterTypes]);

  // Update filter types when they change
  const contextValue: FilterContextValue = React.useMemo(() => ({
    state: {
      ...state,
      activeFilters: updateFilterTypes(state.activeFilters),
    },
    actions,
    filterGroups,
  }), [state, actions, filterGroups, updateFilterTypes]);

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

// Hook to use filter context
export function useFilterContext(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}

// Convenience hooks for specific functionality
export function useActiveFilters(): ActiveFilter[] {
  const { state } = useFilterContext();
  return state.activeFilters;
}

export function useFilterActions(): FilterActions {
  const { actions } = useFilterContext();
  return actions;
}

export function useFiltersByType(type: FilterType): ActiveFilter[] {
  const { state } = useFilterContext();
  return state.activeFilters.filter(filter => filter.type === type);
}

export function useFilterGroup(groupId: string): {
  group: FilterGroup | undefined;
  activeFilter: ActiveFilter | undefined;
  searchTerm: string;
} {
  const { state, filterGroups } = useFilterContext();
  const group = filterGroups.find(g => g.id === groupId);
  const activeFilter = state.activeFilters.find(f => f.groupId === groupId);
  const searchTerm = state.searchTerms[groupId] || '';

  return { group, activeFilter, searchTerm };
}

// Hook for filter statistics
export function useFilterStats(): {
  totalFilters: number;
  filtersByType: Record<FilterType, number>;
  isFiltered: boolean;
  lastUpdated: Date | null;
} {
  const { state } = useFilterContext();
  
  const filtersByType = state.activeFilters.reduce((acc, filter) => {
    acc[filter.type] = (acc[filter.type] || 0) + 1;
    return acc;
  }, {} as Record<FilterType, number>);

  return {
    totalFilters: state.activeFilters.length,
    filtersByType,
    isFiltered: state.activeFilters.length > 0,
    lastUpdated: state.lastUpdated,
  };
}

// Hook for generating filter query parameters
export function useFilterQueryParams(): Record<string, string | string[]> {
  const { state, filterGroups } = useFilterContext();
  
  const params: Record<string, string | string[]> = {};
  
  state.activeFilters.forEach(filter => {
    const group = filterGroups.find(g => g.id === filter.groupId);
    if (group) {
      const paramKey = group.type === 'custom' ? group.id : group.type;
      params[paramKey] = filter.optionIds;
    }
  });
  
  return params;
}