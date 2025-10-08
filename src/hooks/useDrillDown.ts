// src/hooks/useDrillDown.ts
// Custom hook for managing KPI drill-down functionality
// Handles modal state and data fetching for detailed analytics

import { useState, useCallback } from 'react';
import { PharmaKPICardData } from '@/lib/types/dashboard';

export interface DrillDownState {
  isOpen: boolean;
  kpiData: PharmaKPICardData | null;
  kpiId: string | null;
  organizationId: string | null;
  productId?: string;
  territoryId?: string;
}

export function useDrillDown() {
  const [state, setState] = useState<DrillDownState>({
    isOpen: false,
    kpiData: null,
    kpiId: null,
    organizationId: null,
    productId: undefined,
    territoryId: undefined
  });

  const openDrillDown = useCallback((
    kpiData: PharmaKPICardData,
    kpiId: string,
    organizationId: string,
    productId?: string,
    territoryId?: string
  ) => {
    setState({
      isOpen: true,
      kpiData,
      kpiId,
      organizationId,
      productId,
      territoryId
    });
  }, []);

  const closeDrillDown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const resetDrillDown = useCallback(() => {
    setState({
      isOpen: false,
      kpiData: null,
      kpiId: null,
      organizationId: null,
      productId: undefined,
      territoryId: undefined
    });
  }, []);

  return {
    ...state,
    openDrillDown,
    closeDrillDown,
    resetDrillDown
  };
}