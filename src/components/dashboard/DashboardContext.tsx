// src/components/dashboard/DashboardContext.tsx
// Dashboard Context Provider for KPI Data Management
// Provides centralized KPI calculations and caching for dashboard widgets

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthService } from '@/lib/auth-unified';
import { kpiEngine, KPICalculationParams, KPICalculation } from '@/lib/bi/kpi-engine';
import { UserRole } from '@/lib/roles';

export interface KPICacheEntry {
  data: KPICalculation;
  timestamp: Date;
  ttl: number; // Time to live in minutes
}

export interface DashboardContextState {
  // User context
  organizationId: string | null;
  userId: string | null;
  userRole: UserRole | null;
  
  // KPI settings
  defaultPeriodDays: number;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // KPI data cache
  kpiCache: Map<string, KPICacheEntry>;
  
  // Loading states
  isInitializing: boolean;
  
  // Methods
  calculateKPI: (kpiId: string, params?: Partial<KPICalculationParams>) => Promise<KPICalculation>;
  refreshAllKPIs: () => Promise<void>;
  clearKPICache: () => void;
  updateSettings: (settings: Partial<DashboardSettings>) => void;
}

export interface DashboardSettings {
  defaultPeriodDays: number;
  autoRefresh: boolean;
  refreshInterval: number;
  productId?: string;
  territoryId?: string;
}

const DashboardContext = createContext<DashboardContextState | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
  initialSettings?: Partial<DashboardSettings>;
}

export function DashboardProvider({ children, initialSettings = {} }: DashboardProviderProps) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Dashboard settings
  const [settings, setSettings] = useState<DashboardSettings>({
    defaultPeriodDays: 30,
    autoRefresh: true,
    refreshInterval: 15, // minutes
    ...initialSettings
  });

  // KPI cache with TTL
  const [kpiCache] = useState(new Map<string, KPICacheEntry>());

  // Initialize user context
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setUserId(user.id);
          if (user.profile) {
            setOrganizationId(user.profile.organization_id);
            setUserRole(user.profile.role as UserRole);
            console.log('Dashboard context initialized:', {
              userId: user.id,
              organizationId: user.profile.organization_id,
              role: user.profile.role
            });
          } else {
            console.warn('User profile not found, using defaults');
            setUserRole(UserRole.SALESMAN);
          }
        } else {
          console.warn('No authenticated user found');
        }
      } catch (error) {
        console.error('Failed to initialize dashboard context:', error);
        // Set defaults on error
        setUserRole(UserRole.SALESMAN);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeContext();
  }, []);

  // Generate cache key for KPI
  const generateCacheKey = useCallback((kpiId: string, params: Partial<KPICalculationParams>): string => {
    const key = {
      kpiId,
      organizationId: params.organizationId || organizationId,
      productId: params.productId || settings.productId,
      territoryId: params.territoryId || settings.territoryId,
      periodDays: params.periodStart && params.periodEnd 
        ? Math.ceil((params.periodEnd.getTime() - params.periodStart.getTime()) / (1000 * 60 * 60 * 24))
        : settings.defaultPeriodDays
    };
    return JSON.stringify(key);
  }, [organizationId, settings]);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheEntry: { timestamp: Date; ttl: number }): boolean => {
    const now = new Date();
    const expiryTime = new Date(cacheEntry.timestamp.getTime() + cacheEntry.ttl * 60 * 1000);
    return now < expiryTime;
  }, []);

  // Calculate KPI with caching
  const calculateKPI = useCallback(async (
    kpiId: string, 
    params: Partial<KPICalculationParams> = {}
  ): Promise<KPICalculation> => {
    if (!organizationId) {
      throw new Error('Organization ID not available');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(kpiId, params);
    
    // Check cache first
    const cached = kpiCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      return cached.data;
    }

    // Prepare calculation parameters
    const calculationParams: KPICalculationParams = {
      organizationId: params.organizationId || organizationId,
      productId: params.productId || settings.productId,
      territoryId: params.territoryId || settings.territoryId,
      periodStart: params.periodStart || new Date(Date.now() - settings.defaultPeriodDays * 24 * 60 * 60 * 1000),
      periodEnd: params.periodEnd || new Date()
    };

    try {
      let calculation;
      
      // Call appropriate KPI calculation method
      switch (kpiId) {
        case 'trx':
          calculation = await kpiEngine.calculateTRx(calculationParams);
          break;
        case 'nrx':
          calculation = await kpiEngine.calculateNRx(calculationParams);
          break;
        case 'market_share':
          calculation = await kpiEngine.calculateMarketShare(calculationParams);
          break;
        case 'growth':
          calculation = await kpiEngine.calculateGrowth(calculationParams);
          break;
        case 'reach':
          calculation = await kpiEngine.calculateReach(calculationParams);
          break;
        case 'frequency':
          calculation = await kpiEngine.calculateFrequency(calculationParams);
          break;
        case 'call_effectiveness':
          calculation = await kpiEngine.calculateCallEffectiveness(calculationParams);
          break;
        case 'sample_to_script_ratio':
          calculation = await kpiEngine.calculateSampleToScriptRatio(calculationParams);
          break;
        case 'formulary_access':
          calculation = await kpiEngine.calculateFormularyAccess(calculationParams);
          break;
        default:
          throw new Error(`Unknown KPI: ${kpiId}`);
      }

      // Cache the result
      kpiCache.set(cacheKey, {
        data: calculation,
        timestamp: new Date(),
        ttl: settings.refreshInterval // Use refresh interval as TTL
      });

      return calculation;
    } catch (error) {
      console.error(`Failed to calculate KPI ${kpiId}:`, error);
      throw error;
    }
  }, [organizationId, settings, generateCacheKey, isCacheValid, kpiCache]);

  // Refresh all cached KPIs
  const refreshAllKPIs = useCallback(async (): Promise<void> => {
    if (!organizationId) return;

    const promises: Promise<KPICalculation>[] = [];
    
    // Get all cached KPI keys and recalculate them
    for (const [cacheKey] of kpiCache) {
      try {
        const keyData = JSON.parse(cacheKey);
        const { kpiId, ...params } = keyData;
        
        // Remove from cache to force recalculation
        kpiCache.delete(cacheKey);
        
        // Recalculate
        promises.push(calculateKPI(kpiId, params));
      } catch (error) {
        console.error('Failed to parse cache key:', cacheKey, error);
      }
    }

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to refresh all KPIs:', error);
    }
  }, [organizationId, kpiCache, calculateKPI]);

  // Clear KPI cache
  const clearKPICache = useCallback((): void => {
    kpiCache.clear();
  }, [kpiCache]);

  // Update dashboard settings
  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>): void => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Clear cache when settings change to force recalculation
    clearKPICache();
  }, [clearKPICache]);

  // Auto-refresh effect
  useEffect(() => {
    if (!settings.autoRefresh || !organizationId) return;

    const interval = setInterval(() => {
      refreshAllKPIs();
    }, settings.refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, organizationId, refreshAllKPIs]);

  const contextValue: DashboardContextState = {
    organizationId,
    userId,
    userRole,
    defaultPeriodDays: settings.defaultPeriodDays,
    autoRefresh: settings.autoRefresh,
    refreshInterval: settings.refreshInterval,
    kpiCache,
    isInitializing,
    calculateKPI,
    refreshAllKPIs,
    clearKPICache,
    updateSettings
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export default DashboardProvider;