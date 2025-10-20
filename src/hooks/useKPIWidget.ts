// src/hooks/useKPIWidget.ts
// Hook for managing KPI widget state and data
// Provides simplified interface for using KPI widgets with real-time data

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import { PharmaKPICardData } from '@/lib/types/dashboard';
import { KPICalculationParams } from '@/lib/bi/kpi-engine';

export interface UseKPIWidgetOptions {
  kpiId: string;
  initialData: PharmaKPICardData;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  productId?: string;
  territoryId?: string;
}

export interface UseKPIWidgetReturn {
  data: PharmaKPICardData;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
  refresh: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
}

export function useKPIWidget({
  kpiId,
  initialData,
  autoRefresh = false,
  refreshInterval = 15,
  productId,
  territoryId
}: UseKPIWidgetOptions): UseKPIWidgetReturn {
  const dashboard = useDashboard();
  const [data, setData] = useState<PharmaKPICardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  // Calculate and update KPI data
  const calculateKPI = useCallback(async () => {
    if (!dashboard.organizationId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: Partial<KPICalculationParams> = {
        productId,
        territoryId,
        periodStart: new Date(Date.now() - dashboard.defaultPeriodDays * 24 * 60 * 60 * 1000),
        periodEnd: new Date()
      };

      const calculation = await dashboard.calculateKPI(kpiId, params);

      // Update data with calculated values
      setData(prev => ({
        ...prev,
        value: calculation.value,
        confidence: calculation.confidence,
        trend: calculation.value > prev.value ? 'up' : calculation.value < prev.value ? 'down' : 'stable',
        metadata: {
          ...prev.metadata,
          ...calculation.metadata,
          calculatedAt: calculation.calculatedAt.toISOString()
        }
      }));

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate KPI');
      console.error(`KPI calculation error for ${kpiId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [dashboard, kpiId, productId, territoryId]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled && dashboard.organizationId && !dashboard.isInitializing) {
      // Initial calculation
      calculateKPI();

      // Set up interval for auto-refresh
      const interval = setInterval(() => {
        calculateKPI();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, refreshInterval, calculateKPI, dashboard.organizationId, dashboard.isInitializing]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await calculateKPI();
  }, [calculateKPI]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    setAutoRefresh: setAutoRefreshEnabled
  };
}