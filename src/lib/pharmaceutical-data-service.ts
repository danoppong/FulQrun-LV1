// src/lib/pharmaceutical-data-service.ts
// Pharmaceutical Data Service for Dashboard Integration
// Provides pharmaceutical KPI data for dashboard widgets

import { PharmaKPICardData, TerritoryPerformanceData, ProductPerformanceData, HCPEngagementData, SampleDistributionData, FormularyAccessData } from '@/lib/types/dashboard'
import { UserRole } from '@/lib/roles';

export interface PharmaceuticalDataParams {
  organizationId: string;
  userId: string;
  userRole: UserRole;
  periodStart?: Date;
  periodEnd?: Date;
  territoryId?: string;
  productId?: string;
}

export class PharmaceuticalDataService {
  /**
   * Get pharmaceutical KPIs for a user based on their role
   */
  static async getKPIsForUser(params: PharmaceuticalDataParams): Promise<PharmaKPICardData[]> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.territoryId && { territoryId: params.territoryId }),
        ...(params.productId && { productId: params.productId }),
        ...(params.userRole === 'salesman' && { repId: params.userId })
      });

      const response = await fetch(`/api/bi/kpis?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pharmaceutical KPIs: ${response.statusText}`);
      }

      const kpis = await response.json();
      
      return kpis.map((kpi: any) => ({
        kpiId: kpi.kpiId,
        kpiName: kpi.kpiName,
        value: kpi.value,
        confidence: kpi.confidence,
        trend: this.determineTrend(kpi.value, kpi.previousValue),
        format: this.getKPIColor(kpi.kpiId),
        metadata: kpi.metadata
      }));
    } catch (error) {
      console.error('Error fetching pharmaceutical KPIs:', error);
      return [];
    }
  }

  /**
   * Get territory performance data
   */
  static async getTerritoryPerformance(params: PharmaceuticalDataParams): Promise<TerritoryPerformanceData> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.territoryId && { territoryId: params.territoryId })
      });

      const response = await fetch(`/api/bi/dashboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch territory performance: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        territories: data.territoryPerformance || []
      };
    } catch (error) {
      console.error('Error fetching territory performance:', error);
      return { territories: [] };
    }
  }

  /**
   * Get product performance data
   */
  static async getProductPerformance(params: PharmaceuticalDataParams): Promise<ProductPerformanceData> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.productId && { productId: params.productId })
      });

      const response = await fetch(`/api/bi/dashboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product performance: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        products: data.productPerformance || []
      };
    } catch (error) {
      console.error('Error fetching product performance:', error);
      return { products: [] };
    }
  }

  /**
   * Get HCP engagement data
   */
  static async getHCPEngagement(params: PharmaceuticalDataParams): Promise<HCPEngagementData> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.territoryId && { territoryId: params.territoryId })
      });

      const response = await fetch(`/api/bi/dashboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch HCP engagement: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.hcpEngagement || {
        totalHCPs: 0,
        engagedHCPs: 0,
        engagementRate: 0,
        avgInteractions: 0
      };
    } catch (error) {
      console.error('Error fetching HCP engagement:', error);
      return {
        totalHCPs: 0,
        engagedHCPs: 0,
        engagementRate: 0,
        avgInteractions: 0
      };
    }
  }

  /**
   * Get sample distribution data
   */
  static async getSampleDistribution(params: PharmaceuticalDataParams): Promise<SampleDistributionData> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.productId && { productId: params.productId })
      });

      const response = await fetch(`/api/bi/dashboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sample distribution: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.sampleDistribution || {
        totalSamples: 0,
        totalScripts: 0,
        ratio: 0,
        topProducts: []
      };
    } catch (error) {
      console.error('Error fetching sample distribution:', error);
      return {
        totalSamples: 0,
        totalScripts: 0,
        ratio: 0,
        topProducts: []
      };
    }
  }

  /**
   * Get formulary access data
   */
  static async getFormularyAccess(params: PharmaceuticalDataParams): Promise<FormularyAccessData> {
    try {
      const queryParams = new URLSearchParams({
        organizationId: params.organizationId,
        periodStart: (params.periodStart || this.getDefaultPeriodStart()).toISOString(),
        periodEnd: (params.periodEnd || this.getDefaultPeriodEnd()).toISOString(),
        ...(params.productId && { productId: params.productId })
      });

      const response = await fetch(`/api/bi/dashboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch formulary access: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.formularyAccess || {
        totalAccounts: 0,
        favorableAccounts: 0,
        accessRate: 0,
        topPayers: []
      };
    } catch (error) {
      console.error('Error fetching formulary access:', error);
      return {
        totalAccounts: 0,
        favorableAccounts: 0,
        accessRate: 0,
        topPayers: []
      };
    }
  }

  /**
   * Get available pharmaceutical widgets for a user role
   */
  static getAvailableWidgets(userRole: UserRole): string[] {
    switch (userRole) {
      case 'salesman':
        return ['pharma_kpi_card', 'product_performance'];
      case 'sales_manager':
        return ['pharma_kpi_card', 'territory_performance', 'hcp_engagement'];
      case 'regional_sales_director':
      case 'global_sales_lead':
        return [
          'pharma_kpi_card',
          'territory_performance',
          'product_performance',
          'hcp_engagement',
          'sample_distribution',
          'formulary_access'
        ];
      default:
        return ['pharma_kpi_card'];
    }
  }

  /**
   * Get default period start (30 days ago)
   */
  private static getDefaultPeriodStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }

  /**
   * Get default period end (today)
   */
  private static getDefaultPeriodEnd(): Date {
    return new Date();
  }

  /**
   * Determine trend based on current and previous values
   */
  private static determineTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  /**
   * Get KPI format based on KPI ID
   */
  private static getKPIColor(kpiId: string): 'number' | 'percentage' | 'currency' | 'ratio' {
    switch (kpiId) {
      case 'market_share':
      case 'growth':
      case 'reach':
      case 'engagement_rate':
        return 'percentage';
      case 'trx':
      case 'nrx':
      case 'total_calls':
      case 'total_samples':
        return 'number';
      case 'sample_to_script_ratio':
      case 'call_effectiveness':
        return 'ratio';
      default:
        return 'number';
    }
  }
}
