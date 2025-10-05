// src/lib/bi/kpi-engine.ts
// Pharmaceutical KPI Calculation Engine
// Handles calculation of TRx, NRx, Market Share, Call Effectiveness, and other pharmaceutical KPIs

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton';

export interface KPICalculationParams {
  organizationId: string;
  productId?: string;
  territoryId?: string;
  repId?: string;
  periodStart: Date;
  periodEnd: Date;
  filters?: Record<string, any>;
}

export interface KPICalculation {
  kpiId: string;
  kpiName: string;
  value: number;
  confidence: number;
  calculatedAt: Date;
  metadata: Record<string, any>;
}

export interface KPIDefinition {
  id: string;
  name: string;
  definition: string;
  formula: string;
  grain: string[];
  dimensions: string[];
  thresholds: {
    warning?: string;
    critical?: string;
  };
  owner: string;
}

export class KPIEngine {
  private supabase = getSupabaseBrowserClient();

  /**
   * Calculate Total Prescriptions (TRx)
   */
  async calculateTRx(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;
    
    const { data, error } = await this.supabase.rpc('calculate_trx', {
      p_organization_id: organizationId,
      p_product_id: productId,
      p_territory_id: territoryId,
      p_period_start: periodStart.toISOString().split('T')[0],
      p_period_end: periodEnd.toISOString().split('T')[0]
    });

    if (error) {
      throw new Error(`TRx calculation failed: ${error.message}`);
    }

    return {
      kpiId: 'trx',
      kpiName: 'Total Prescriptions (TRx)',
      value: data || 0,
      confidence: 1.0,
      calculatedAt: new Date(),
      metadata: {
        productId,
        territoryId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      }
    };
  }

  /**
   * Calculate New Prescriptions (NRx)
   */
  async calculateNRx(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;
    
    const { data, error } = await this.supabase.rpc('calculate_nrx', {
      p_organization_id: organizationId,
      p_product_id: productId,
      p_territory_id: territoryId,
      p_period_start: periodStart.toISOString().split('T')[0],
      p_period_end: periodEnd.toISOString().split('T')[0]
    });

    if (error) {
      throw new Error(`NRx calculation failed: ${error.message}`);
    }

    return {
      kpiId: 'nrx',
      kpiName: 'New Prescriptions (NRx)',
      value: data || 0,
      confidence: 1.0,
      calculatedAt: new Date(),
      metadata: {
        productId,
        territoryId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      }
    };
  }

  /**
   * Calculate Market Share percentage
   */
  async calculateMarketShare(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;
    
    if (!productId) {
      throw new Error('Product ID is required for market share calculation');
    }

    const { data, error } = await this.supabase.rpc('calculate_market_share', {
      p_organization_id: organizationId,
      p_product_id: productId,
      p_territory_id: territoryId,
      p_period_start: periodStart.toISOString().split('T')[0],
      p_period_end: periodEnd.toISOString().split('T')[0]
    });

    if (error) {
      throw new Error(`Market share calculation failed: ${error.message}`);
    }

    return {
      kpiId: 'market_share',
      kpiName: 'Market Share %',
      value: data || 0,
      confidence: 0.9, // Market share calculations have some uncertainty
      calculatedAt: new Date(),
      metadata: {
        productId,
        territoryId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      }
    };
  }

  /**
   * Calculate Growth percentage (period-over-period)
   */
  async calculateGrowth(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;
    
    // Calculate current period TRx
    const currentTRx = await this.calculateTRx(params);
    
    // Calculate previous period TRx
    const periodLength = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodLength);
    const previousPeriodEnd = new Date(periodStart.getTime() - 1);
    
    const previousTRx = await this.calculateTRx({
      ...params,
      periodStart: previousPeriodStart,
      periodEnd: previousPeriodEnd
    });

    const growth = previousTRx.value > 0 
      ? ((currentTRx.value - previousTRx.value) / previousTRx.value) * 100
      : 0;

    return {
      kpiId: 'growth',
      kpiName: 'Growth %',
      value: growth,
      confidence: 0.8, // Growth calculations have moderate uncertainty
      calculatedAt: new Date(),
      metadata: {
        currentPeriod: currentTRx.value,
        previousPeriod: previousTRx.value,
        periodLength: periodLength / (1000 * 60 * 60 * 24) // days
      }
    };
  }

  /**
   * Calculate Call Effectiveness Index
   */
  async calculateCallEffectiveness(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, repId, territoryId, periodStart, periodEnd } = params;
    
    const { data, error } = await this.supabase.rpc('calculate_call_effectiveness', {
      p_organization_id: organizationId,
      p_rep_id: repId,
      p_territory_id: territoryId,
      p_period_start: periodStart.toISOString().split('T')[0],
      p_period_end: periodEnd.toISOString().split('T')[0]
    });

    if (error) {
      throw new Error(`Call effectiveness calculation failed: ${error.message}`);
    }

    return {
      kpiId: 'call_effectiveness',
      kpiName: 'Call Effectiveness Index',
      value: data || 0,
      confidence: 0.7, // Call effectiveness has higher uncertainty
      calculatedAt: new Date(),
      metadata: {
        repId,
        territoryId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      }
    };
  }

  /**
   * Calculate Reach percentage
   */
  async calculateReach(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, territoryId, periodStart, periodEnd } = params;
    
    // Get total target HCPs
    const { data: totalHCPs, error: hcpError } = await this.supabase
      .from('healthcare_providers')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .modify((query) => {
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (hcpError) {
      throw new Error(`Reach calculation failed: ${hcpError.message}`);
    }

    // Get engaged HCPs (those with calls in the period)
    const { data: engagedHCPs, error: callError } = await this.supabase
      .from('pharmaceutical_calls')
      .select('hcp_id')
      .eq('organization_id', organizationId)
      .gte('call_date', periodStart.toISOString())
      .lte('call_date', periodEnd.toISOString())
      .modify((query) => {
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (callError) {
      throw new Error(`Reach calculation failed: ${callError.message}`);
    }

    const uniqueEngagedHCPs = new Set(engagedHCPs?.map(call => call.hcp_id) || []);
    const reach = totalHCPs && totalHCPs.length > 0 
      ? (uniqueEngagedHCPs.size / totalHCPs.length) * 100
      : 0;

    return {
      kpiId: 'reach',
      kpiName: 'Reach %',
      value: reach,
      confidence: 0.9,
      calculatedAt: new Date(),
      metadata: {
        totalHCPs: totalHCPs?.length || 0,
        engagedHCPs: uniqueEngagedHCPs.size,
        territoryId
      }
    };
  }

  /**
   * Calculate Frequency (average calls per engaged HCP)
   */
  async calculateFrequency(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, territoryId, periodStart, periodEnd } = params;
    
    // Get total calls in period
    const { data: calls, error: callError } = await this.supabase
      .from('pharmaceutical_calls')
      .select('hcp_id')
      .eq('organization_id', organizationId)
      .gte('call_date', periodStart.toISOString())
      .lte('call_date', periodEnd.toISOString())
      .modify((query) => {
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (callError) {
      throw new Error(`Frequency calculation failed: ${callError.message}`);
    }

    // Get unique engaged HCPs
    const uniqueHCPs = new Set(calls?.map(call => call.hcp_id) || []);
    const frequency = uniqueHCPs.size > 0 
      ? calls!.length / uniqueHCPs.size
      : 0;

    return {
      kpiId: 'frequency',
      kpiName: 'Frequency',
      value: frequency,
      confidence: 0.95,
      calculatedAt: new Date(),
      metadata: {
        totalCalls: calls?.length || 0,
        uniqueHCPs: uniqueHCPs.size,
        territoryId
      }
    };
  }

  /**
   * Calculate Sample-to-Script Ratio
   */
  async calculateSampleToScriptRatio(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;
    
    // Get total samples distributed
    const { data: samples, error: sampleError } = await this.supabase
      .from('sample_distributions')
      .select('quantity')
      .eq('organization_id', organizationId)
      .gte('distribution_date', periodStart.toISOString().split('T')[0])
      .lte('distribution_date', periodEnd.toISOString().split('T')[0])
      .modify((query) => {
        if (productId) {
          query.eq('product_id', productId);
        }
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (sampleError) {
      throw new Error(`Sample-to-script ratio calculation failed: ${sampleError.message}`);
    }

    const totalSamples = samples?.reduce((sum, sample) => sum + sample.quantity, 0) || 0;

    // Get NRx for the same period
    const nrxCalculation = await this.calculateNRx(params);
    const ratio = nrxCalculation.value > 0 
      ? totalSamples / nrxCalculation.value
      : 0;

    return {
      kpiId: 'sample_to_script_ratio',
      kpiName: 'Sample-to-Script Ratio',
      value: ratio,
      confidence: 0.8,
      calculatedAt: new Date(),
      metadata: {
        totalSamples,
        nrx: nrxCalculation.value,
        productId,
        territoryId
      }
    };
  }

  /**
   * Calculate Formulary Access percentage
   */
  async calculateFormularyAccess(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId } = params;
    
    if (!productId) {
      throw new Error('Product ID is required for formulary access calculation');
    }

    // Get total target accounts
    const { data: totalAccounts, error: accountError } = await this.supabase
      .from('healthcare_providers')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .modify((query) => {
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (accountError) {
      throw new Error(`Formulary access calculation failed: ${accountError.message}`);
    }

    // Get accounts with favorable access
    const { data: favorableAccounts, error: formularyError } = await this.supabase
      .from('formulary_access')
      .select('payer_id')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .in('coverage_level', ['preferred', 'standard'])
      .modify((query) => {
        if (territoryId) {
          query.eq('territory_id', territoryId);
        }
      });

    if (formularyError) {
      throw new Error(`Formulary access calculation failed: ${formularyError.message}`);
    }

    const access = totalAccounts && totalAccounts.length > 0 
      ? (favorableAccounts?.length || 0) / totalAccounts.length * 100
      : 0;

    return {
      kpiId: 'formulary_access',
      kpiName: 'Formulary Access %',
      value: access,
      confidence: 0.7, // Formulary data can be outdated
      calculatedAt: new Date(),
      metadata: {
        totalAccounts: totalAccounts?.length || 0,
        favorableAccounts: favorableAccounts?.length || 0,
        productId,
        territoryId
      }
    };
  }

  /**
   * Calculate all pharmaceutical KPIs for a given set of parameters
   */
  async calculateAllKPIs(params: KPICalculationParams): Promise<KPICalculation[]> {
    const calculations = await Promise.allSettled([
      this.calculateTRx(params),
      this.calculateNRx(params),
      this.calculateGrowth(params),
      this.calculateReach(params),
      this.calculateFrequency(params),
      this.calculateCallEffectiveness(params),
      this.calculateSampleToScriptRatio(params),
      this.calculateFormularyAccess(params)
    ]);

    return calculations
      .filter((result): result is PromiseFulfilledResult<KPICalculation> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Get KPI definitions for an organization
   */
  async getKPIDefinitions(organizationId: string): Promise<KPIDefinition[]> {
    const { data, error } = await this.supabase
      .from('pharmaceutical_kpis')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('kpi_name');

    if (error) {
      throw new Error(`Failed to fetch KPI definitions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cache KPI calculation results
   */
  async cacheKPICalculation(calculation: KPICalculation, params: KPICalculationParams): Promise<void> {
    const { data, error } = await this.supabase
      .from('kpi_calculated_values')
      .upsert({
        organization_id: params.organizationId,
        kpi_id: calculation.kpiId,
        calculated_value: calculation.value,
        confidence_score: calculation.confidence,
        calculation_date: calculation.calculatedAt.toISOString().split('T')[0],
        period_start: params.periodStart.toISOString().split('T')[0],
        period_end: params.periodEnd.toISOString().split('T')[0],
        filters: params.filters || {},
        metadata: calculation.metadata
      });

    if (error) {
      console.error('Failed to cache KPI calculation:', error);
    }
  }

  /**
   * Get cached KPI calculation results
   */
  async getCachedKPICalculation(
    organizationId: string,
    kpiId: string,
    periodStart: Date,
    periodEnd: Date,
    filters?: Record<string, any>
  ): Promise<KPICalculation | null> {
    const { data, error } = await this.supabase
      .from('kpi_calculated_values')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('kpi_id', kpiId)
      .eq('calculation_date', new Date().toISOString().split('T')[0])
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])
      .eq('filters', filters || {})
      .single();

    if (error || !data) {
      return null;
    }

    return {
      kpiId: data.kpi_id,
      kpiName: '', // Would need to join with pharmaceutical_kpis table
      value: data.calculated_value,
      confidence: data.confidence_score,
      calculatedAt: new Date(data.created_at),
      metadata: data.metadata
    };
  }
}

// Export singleton instance
export const kpiEngine = new KPIEngine();
