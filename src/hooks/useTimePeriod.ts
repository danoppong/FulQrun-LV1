// src/hooks/useTimePeriod.ts
// Hook for managing time period state and integrating with dashboard components
// Provides centralized time period management for drill-down analytics

import { useState, useCallback, useMemo } from 'react';
import { 
  TimeRange, 
  generateTimeRange, 
  getCurrentMonth, 
  getCurrentQuarter, 
  getCurrentYear,
  formatDateRange,
  isValidDateRange,
  PeriodComparison,
  createPeriodComparison
} from '@/lib/dashboard/timeperiod-utils';

export type TimePeriodPreset = 
  | '7d' | '14d' | '30d' | '60d' | '90d' 
  | 'month' | 'quarter' | 'year' | 'custom';

export interface TimePeriodState {
  // Current time range
  timeRange: TimeRange;
  preset: TimePeriodPreset;
  
  // Comparison data
  comparison: PeriodComparison | null;
  showComparison: boolean;
  
  // UI state
  isCustomRange: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TimePeriodActions {
  // Period selection
  setPreset: (preset: TimePeriodPreset) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  
  // Comparison controls
  toggleComparison: () => void;
  updateComparison: (currentValue: number, previousValue: number) => void;
  
  // Utility functions
  formatCurrentRange: (format?: 'short' | 'long') => string;
  isCurrentPreset: (preset: TimePeriodPreset) => boolean;
  getAvailablePresets: () => Array<{ id: TimePeriodPreset; label: string; range: TimeRange }>;
  
  // Reset and refresh
  reset: () => void;
  refresh: () => void;
}

const defaultTimeRange = generateTimeRange(30, 'Last 30 Days');

const initialState: TimePeriodState = {
  timeRange: defaultTimeRange,
  preset: '30d',
  comparison: null,
  showComparison: false,
  isCustomRange: false,
  isLoading: false,
  error: null,
};

// Utility function to get time range for preset (outside component)
function getInitialTimeRangeForPreset(preset: TimePeriodPreset): TimeRange {
  switch (preset) {
    case '7d': return generateTimeRange(7, 'Last 7 Days');
    case '14d': return generateTimeRange(14, 'Last 14 Days');
    case '30d': return generateTimeRange(30, 'Last 30 Days');
    case '60d': return generateTimeRange(60, 'Last 60 Days');
    case '90d': return generateTimeRange(90, 'Last 90 Days');
    case 'month': return getCurrentMonth();
    case 'quarter': return getCurrentQuarter();
    case 'year': return getCurrentYear();
    case 'custom': return defaultTimeRange;
    default: return defaultTimeRange;
  }
}

export function useTimePeriod(initialPreset: TimePeriodPreset = '30d'): [TimePeriodState, TimePeriodActions] {
  const [state, setState] = useState<TimePeriodState>(() => ({
    ...initialState,
    preset: initialPreset,
    timeRange: getInitialTimeRangeForPreset(initialPreset),
  }));

  // Get time range for a preset
  const getTimeRangeForPreset = useCallback((preset: TimePeriodPreset): TimeRange => {
    switch (preset) {
      case '7d': return generateTimeRange(7, 'Last 7 Days');
      case '14d': return generateTimeRange(14, 'Last 14 Days');
      case '30d': return generateTimeRange(30, 'Last 30 Days');
      case '60d': return generateTimeRange(60, 'Last 60 Days');
      case '90d': return generateTimeRange(90, 'Last 90 Days');
      case 'month': return getCurrentMonth();
      case 'quarter': return getCurrentQuarter();
      case 'year': return getCurrentYear();
      case 'custom': return state.timeRange; // Keep current custom range
      default: return defaultTimeRange;
    }
  }, [state.timeRange]);

  // Set a preset period
  const setPreset = useCallback((preset: TimePeriodPreset) => {
    setState(prev => ({
      ...prev,
      preset,
      timeRange: getTimeRangeForPreset(preset),
      isCustomRange: preset === 'custom',
      error: null,
    }));
  }, [getTimeRangeForPreset]);

  // Set a custom date range
  const setCustomRange = useCallback((startDate: Date, endDate: Date) => {
    if (!isValidDateRange(startDate, endDate)) {
      setState(prev => ({
        ...prev,
        error: 'Invalid date range. End date must be after start date and not in the future.',
      }));
      return;
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const customRange: TimeRange = {
      startDate,
      endDate,
      label: `Custom (${days} days)`,
      days,
    };

    setState(prev => ({
      ...prev,
      preset: 'custom',
      timeRange: customRange,
      isCustomRange: true,
      error: null,
    }));
  }, []);

  // Toggle comparison view
  const toggleComparison = useCallback(() => {
    setState(prev => ({
      ...prev,
      showComparison: !prev.showComparison,
    }));
  }, []);

  // Update comparison data
  const updateComparison = useCallback((currentValue: number, previousValue: number) => {
    const comparison = createPeriodComparison(state.timeRange, currentValue, previousValue);
    setState(prev => ({
      ...prev,
      comparison,
    }));
  }, [state.timeRange]);

  // Format current range for display
  const formatCurrentRange = useCallback((format: 'short' | 'long' = 'short') => {
    return formatDateRange(state.timeRange.startDate, state.timeRange.endDate, format);
  }, [state.timeRange]);

  // Check if a preset is currently selected
  const isCurrentPreset = useCallback((preset: TimePeriodPreset) => {
    return state.preset === preset;
  }, [state.preset]);

  // Get available preset options
  const getAvailablePresets = useCallback(() => {
    const presetMap: Record<TimePeriodPreset, string> = {
      '7d': 'Last 7 Days',
      '14d': 'Last 14 Days', 
      '30d': 'Last 30 Days',
      '60d': 'Last 60 Days',
      '90d': 'Last 90 Days',
      'month': 'This Month',
      'quarter': 'This Quarter',
      'year': 'This Year',
      'custom': 'Custom Range',
    };

    return Object.entries(presetMap).map(([id, label]) => ({
      id: id as TimePeriodPreset,
      label,
      range: getTimeRangeForPreset(id as TimePeriodPreset),
    }));
  }, [getTimeRangeForPreset]);

  // Reset to default state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Refresh current period (useful for real-time updates)
  const refresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRange: getTimeRangeForPreset(prev.preset),
      error: null,
    }));
  }, [getTimeRangeForPreset]);

  // Memoized actions object
  const actions = useMemo<TimePeriodActions>(() => ({
    setPreset,
    setCustomRange,
    toggleComparison,
    updateComparison,
    formatCurrentRange,
    isCurrentPreset,
    getAvailablePresets,
    reset,
    refresh,
  }), [
    setPreset,
    setCustomRange,
    toggleComparison,
    updateComparison,
    formatCurrentRange,
    isCurrentPreset,
    getAvailablePresets,
    reset,
    refresh,
  ]);

  return [state, actions];
}

// Helper hook for getting time period state without actions
export function useTimePeriodState(initialPreset: TimePeriodPreset = '30d'): TimePeriodState {
  const [state] = useTimePeriod(initialPreset);
  return state;
}

// Helper hook for getting formatted time range
export function useFormattedTimeRange(preset: TimePeriodPreset = '30d', format: 'short' | 'long' = 'short'): string {
  const [, actions] = useTimePeriod(preset);
  return actions.formatCurrentRange(format);
}