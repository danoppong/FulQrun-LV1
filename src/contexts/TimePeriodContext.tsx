// src/contexts/TimePeriodContext.tsx
// Global time period context for dashboard-wide time range management
// Provides centralized time period state across all dashboard components

'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  TimeRange, 
  generateTimeRange, 
  getCurrentMonth, 
  getCurrentQuarter, 
  getCurrentYear 
} from '@/lib/dashboard/timeperiod-utils';

export type TimePeriodPreset = 
  | '7d' | '14d' | '30d' | '60d' | '90d' 
  | 'month' | 'quarter' | 'year' | 'custom';

export interface TimePeriodState {
  // Primary time range
  timeRange: TimeRange;
  preset: TimePeriodPreset;
  
  // Comparison periods
  showComparison: boolean;
  comparisonRange: TimeRange | null;
  
  // UI state
  isCustomRange: boolean;
  isLoading: boolean;
  
  // Dashboard sync
  autoRefresh: boolean;
  lastUpdated: Date | null;
}

export interface TimePeriodActions {
  setPreset: (preset: TimePeriodPreset) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  setComparison: (enabled: boolean, range?: TimeRange) => void;
  toggleAutoRefresh: () => void;
  refreshPeriod: () => void;
  reset: () => void;
}

type TimePeriodAction =
  | { type: 'SET_PRESET'; payload: TimePeriodPreset }
  | { type: 'SET_CUSTOM_RANGE'; payload: { startDate: Date; endDate: Date } }
  | { type: 'SET_COMPARISON'; payload: { enabled: boolean; range?: TimeRange } }
  | { type: 'TOGGLE_AUTO_REFRESH' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REFRESH_PERIOD' }
  | { type: 'RESET' };

const defaultTimeRange = generateTimeRange(30, 'Last 30 Days');

const initialState: TimePeriodState = {
  timeRange: defaultTimeRange,
  preset: '30d',
  showComparison: false,
  comparisonRange: null,
  isCustomRange: false,
  isLoading: false,
  autoRefresh: false,
  lastUpdated: null,
};

function getTimeRangeForPreset(preset: TimePeriodPreset): TimeRange {
  switch (preset) {
    case '7d': return generateTimeRange(7, 'Last 7 Days');
    case '14d': return generateTimeRange(14, 'Last 14 Days');
    case '30d': return generateTimeRange(30, 'Last 30 Days');
    case '60d': return generateTimeRange(60, 'Last 60 Days');
    case '90d': return generateTimeRange(90, 'Last 90 Days');
    case 'month': return getCurrentMonth();
    case 'quarter': return getCurrentQuarter();
    case 'year': return getCurrentYear();
    default: return defaultTimeRange;
  }
}

function timePeriodReducer(state: TimePeriodState, action: TimePeriodAction): TimePeriodState {
  switch (action.type) {
    case 'SET_PRESET':
      const newRange = getTimeRangeForPreset(action.payload);
      return {
        ...state,
        preset: action.payload,
        timeRange: newRange,
        isCustomRange: action.payload === 'custom',
        lastUpdated: new Date(),
      };

    case 'SET_CUSTOM_RANGE':
      const { startDate, endDate } = action.payload;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const customRange: TimeRange = {
        startDate,
        endDate,
        label: `Custom (${days} days)`,
        days,
      };
      return {
        ...state,
        preset: 'custom',
        timeRange: customRange,
        isCustomRange: true,
        lastUpdated: new Date(),
      };

    case 'SET_COMPARISON':
      return {
        ...state,
        showComparison: action.payload.enabled,
        comparisonRange: action.payload.range || null,
      };

    case 'TOGGLE_AUTO_REFRESH':
      return {
        ...state,
        autoRefresh: !state.autoRefresh,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'REFRESH_PERIOD':
      return {
        ...state,
        timeRange: state.isCustomRange ? state.timeRange : getTimeRangeForPreset(state.preset),
        lastUpdated: new Date(),
      };

    case 'RESET':
      return {
        ...initialState,
        lastUpdated: new Date(),
      };

    default:
      return state;
  }
}

const TimePeriodContext = createContext<{
  state: TimePeriodState;
  actions: TimePeriodActions;
} | null>(null);

interface TimePeriodProviderProps {
  children: ReactNode;
  initialPreset?: TimePeriodPreset;
}

export function TimePeriodProvider({ children, initialPreset = '30d' }: TimePeriodProviderProps) {
  const [state, dispatch] = useReducer(timePeriodReducer, {
    ...initialState,
    preset: initialPreset,
    timeRange: getTimeRangeForPreset(initialPreset),
  });

  const actions: TimePeriodActions = React.useMemo(() => ({
    setPreset: (preset: TimePeriodPreset) => {
      dispatch({ type: 'SET_PRESET', payload: preset });
    },

    setCustomRange: (startDate: Date, endDate: Date) => {
      dispatch({ type: 'SET_CUSTOM_RANGE', payload: { startDate, endDate } });
    },

    setComparison: (enabled: boolean, range?: TimeRange) => {
      dispatch({ type: 'SET_COMPARISON', payload: { enabled, range } });
    },

    toggleAutoRefresh: () => {
      dispatch({ type: 'TOGGLE_AUTO_REFRESH' });
    },

    refreshPeriod: () => {
      dispatch({ type: 'REFRESH_PERIOD' });
    },

    reset: () => {
      dispatch({ type: 'RESET' });
    },
  }), []);

  // Auto-refresh effect
  React.useEffect(() => {
    if (!state.autoRefresh) return;

    const interval = setInterval(() => {
      actions.refreshPeriod();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [state.autoRefresh, actions]);

  return (
    <TimePeriodContext.Provider value={{ state, actions }}>
      {children}
    </TimePeriodContext.Provider>
  );
}

// Hook to use time period context
export function useTimePeriodContext() {
  const context = useContext(TimePeriodContext);
  if (!context) {
    throw new Error('useTimePeriodContext must be used within a TimePeriodProvider');
  }
  return context;
}

// Convenience hooks for specific functionality
export function useCurrentTimeRange(): TimeRange {
  const { state } = useTimePeriodContext();
  return state.timeRange;
}

export function useTimePeriodActions(): TimePeriodActions {
  const { actions } = useTimePeriodContext();
  return actions;
}

export function useTimePeriodComparison(): {
  showComparison: boolean;
  comparisonRange: TimeRange | null;
  setComparison: (enabled: boolean, range?: TimeRange) => void;
} {
  const { state, actions } = useTimePeriodContext();
  return {
    showComparison: state.showComparison,
    comparisonRange: state.comparisonRange,
    setComparison: actions.setComparison,
  };
}

// Helper hook for formatted date ranges
export function useFormattedTimeRange(format: 'short' | 'long' = 'short'): string {
  const timeRange = useCurrentTimeRange();
  const start = timeRange.startDate.toLocaleDateString('en-US', 
    format === 'short' ? { month: 'short', day: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' }
  );
  const end = timeRange.endDate.toLocaleDateString('en-US', 
    format === 'short' ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' }
  );
  return `${start} - ${end}`;
}

// Hook for dashboard synchronization
export function useTimePeriodSync(): {
  isLoading: boolean;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refresh: () => void;
  toggleAutoRefresh: () => void;
} {
  const { state, actions } = useTimePeriodContext();
  return {
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    autoRefresh: state.autoRefresh,
    refresh: actions.refreshPeriod,
    toggleAutoRefresh: actions.toggleAutoRefresh,
  };
}