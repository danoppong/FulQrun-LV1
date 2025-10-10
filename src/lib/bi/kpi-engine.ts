/* eslint-disable @typescript-eslint/no-explicit-any */
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
  filters?: Record<string, unknown>;
}

export interface KPICalculation {
  kpiId: string;
  kpiName: string;
  value: number;
  confidence: number;
  calculatedAt: Date;
  metadata: Record<string, unknown>;
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
    
  const { data, error } = await (this.supabase as any).rpc('calculate_trx', {
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
        value: (data as unknown as number) || 0,
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
    
  const { data, error } = await (this.supabase as any).rpc('calculate_nrx', {
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
        value: (data as unknown as number) || 0,
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

  const { data, error } = await (this.supabase as any).rpc('calculate_market_share', {
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
        value: (data as unknown as number) || 0,
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
    const { periodStart, periodEnd } = params;
    
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
    
    const { data, error } = await (this.supabase as any).rpc('calculate_call_effectiveness', {
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
        value: (data as unknown as number) || 0,
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
    
    // Get total target HCPs (count only)
    const { count: totalHcpCount, error: hcpError } = await (this.supabase as any)
      .from('healthcare_providers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);
    let filteredHcpCount = totalHcpCount || 0;
    if (territoryId) {
      const { count } = await (this.supabase as any)
        .from('healthcare_providers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('territory_id', territoryId);
      filteredHcpCount = count ?? filteredHcpCount;
    }

    if (hcpError) {
      throw new Error(`Reach calculation failed: ${hcpError.message}`);
    }

    // Get engaged HCPs (those with calls in the period)
    let callsQuery = (this.supabase as any)
      .from('pharmaceutical_calls')
      .select('hcp_id, territory_id')
      .eq('organization_id', organizationId)
      .gte('call_date', periodStart.toISOString())
      .lte('call_date', periodEnd.toISOString());
    if (territoryId) {
      callsQuery = callsQuery.eq('territory_id', territoryId);
    }
    const { data: engagedHCPs, error: callError } = await callsQuery;

    if (callError) {
      throw new Error(`Reach calculation failed: ${callError.message}`);
    }

  const uniqueEngagedHCPs = new Set((engagedHCPs || []).map((call: any) => call.hcp_id));
    const reach = filteredHcpCount > 0 
      ? (uniqueEngagedHCPs.size / filteredHcpCount) * 100
      : 0;

    return {
      kpiId: 'reach',
      kpiName: 'Reach %',
      value: reach,
      confidence: 0.9,
      calculatedAt: new Date(),
      metadata: {
  totalHCPs: filteredHcpCount || 0,
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
    let freqQuery = (this.supabase as any)
      .from('pharmaceutical_calls')
      .select('hcp_id, territory_id')
      .eq('organization_id', organizationId)
      .gte('call_date', periodStart.toISOString())
      .lte('call_date', periodEnd.toISOString());
    if (territoryId) {
      freqQuery = freqQuery.eq('territory_id', territoryId);
    }
    const { data: calls, error: callError } = await freqQuery;

    if (callError) {
      throw new Error(`Frequency calculation failed: ${callError.message}`);
    }

    // Get unique engaged HCPs
    const uniqueHCPs = new Set((calls || []).map((call: any) => call.hcp_id));
    const frequency = uniqueHCPs.size > 0 
      ? (calls?.length || 0) / uniqueHCPs.size
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
    let samplesQuery = (this.supabase as any)
      .from('sample_distributions')
      .select('quantity, product_id, territory_id')
      .eq('organization_id', organizationId)
      .gte('distribution_date', periodStart.toISOString().split('T')[0])
      .lte('distribution_date', periodEnd.toISOString().split('T')[0]);
    if (productId) samplesQuery = samplesQuery.eq('product_id', productId);
    if (territoryId) samplesQuery = samplesQuery.eq('territory_id', territoryId);
    const { data: samples, error: sampleError } = await samplesQuery;

    if (sampleError) {
      throw new Error(`Sample-to-script ratio calculation failed: ${sampleError.message}`);
    }

  const totalSamples = (samples || []).reduce((sum: number, sample: any) => sum + Number(sample.quantity || 0), 0) || 0;

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
    const { count: totalAccountsCount, error: accountError } = await (this.supabase as any)
      .from('healthcare_providers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (accountError) {
      throw new Error(`Formulary access calculation failed: ${accountError.message}`);
    }

    // Get accounts with favorable access
    let favorableQuery = (this.supabase as any)
      .from('formulary_access')
      .select('payer_id')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .in('coverage_level', ['preferred', 'standard']);
    if (territoryId) favorableQuery = favorableQuery.eq('territory_id', territoryId);
    const { data: favorableAccounts, error: formularyError } = await favorableQuery;

    if (formularyError) {
      throw new Error(`Formulary access calculation failed: ${formularyError.message}`);
    }

  const accessBase = totalAccountsCount ?? 0;
    const access = accessBase > 0 
      ? (favorableAccounts?.length || 0) / accessBase * 100
      : 0;

    return {
      kpiId: 'formulary_access',
      kpiName: 'Formulary Access %',
      value: access,
      confidence: 0.7, // Formulary data can be outdated
      calculatedAt: new Date(),
      metadata: {
        totalAccounts: totalAccountsCount || 0,
        favorableAccounts: favorableAccounts?.length || 0,
        productId,
        territoryId
      }
    };
  }

  /**
   * Calculate KOL (Key Opinion Leader) Engagement Rate
   * Measures the percentage of KOLs actively engaged vs. total target KOLs
   */
  async calculateKOLEngagement(params: KPICalculationParams): Promise<KPICalculation> {
  const { organizationId, productId, territoryId, periodStart, periodEnd } = params;

    // Get total target KOLs for the territory/product
    let targetQuery = (this.supabase as any)
      .from('hcp_profiles')
      .select('id, territory_id, prescribing_products')
      .eq('organization_id', organizationId)
      .eq('is_kol', true);
    if (territoryId) targetQuery = targetQuery.eq('territory_id', territoryId);
    // Note: contains works server-side; use client-side filter as fallback
    const { data: targetRaw, error: targetError } = await targetQuery;
    const targetKOLs = (targetRaw || []).filter((k: any) =>
      productId ? Array.isArray(k.prescribing_products) && k.prescribing_products.includes(productId) : true
    );

    if (targetError) {
      throw new Error(`KOL target calculation failed: ${targetError.message}`);
    }

    // Get engaged KOLs (those with recent interactions)
    let engagedQuery = (this.supabase as any)
      .from('call_activities')
      .select('hcp_id, product_id')
      .eq('organization_id', organizationId)
      .gte('call_date', periodStart.toISOString())
      .lte('call_date', periodEnd.toISOString())
      .in('hcp_id', (targetKOLs || []).map((k: any) => k.id));
    if (productId) engagedQuery = engagedQuery.eq('product_id', productId);
    const { data: engagedKOLs, error: engagedError } = await engagedQuery;

    if (engagedError) {
      throw new Error(`KOL engagement calculation failed: ${engagedError.message}`);
    }

  const uniqueEngagedKOLs = new Set((engagedKOLs || []).map((c: any) => c.hcp_id)).size;
  const totalKOLs = targetKOLs.length || 0;
    const engagementRate = totalKOLs > 0 ? (uniqueEngagedKOLs / totalKOLs) * 100 : 0;

    return {
      kpiId: 'kol_engagement',
      kpiName: 'KOL Engagement Rate',
      value: engagementRate,
      confidence: 0.92,
      calculatedAt: new Date(),
      metadata: {
        totalKOLs,
        engagedKOLs: uniqueEngagedKOLs,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        productId,
        territoryId
      }
    };
  }

  /**
   * Calculate Formulary Win Rate
   * Percentage of formulary submissions that resulted in favorable access
   */
  async calculateFormularyWinRate(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;

    // Get all formulary submissions in the period
    let submissionsQuery = (this.supabase as any)
      .from('formulary_submissions')
      .select('id, status, product_id, territory_id')
      .eq('organization_id', organizationId)
      .gte('submission_date', periodStart.toISOString())
      .lte('submission_date', periodEnd.toISOString());
    if (productId) submissionsQuery = submissionsQuery.eq('product_id', productId);
    if (territoryId) submissionsQuery = submissionsQuery.eq('territory_id', territoryId);
    const { data: submissions, error: submissionError } = await submissionsQuery;

    if (submissionError) {
      throw new Error(`Formulary submission calculation failed: ${submissionError.message}`);
    }

    const totalSubmissions = (submissions || []).length || 0;
    const wins = (submissions || []).filter((s: any) => 
      s.status === 'approved' || s.status === 'preferred' || s.status === 'tier1'
    ).length || 0;

    const winRate = totalSubmissions > 0 ? (wins / totalSubmissions) * 100 : 0;

    return {
      kpiId: 'formulary_win_rate',
      kpiName: 'Formulary Win Rate',
      value: winRate,
      confidence: 0.88,
      calculatedAt: new Date(),
      metadata: {
        totalSubmissions,
        wins,
        losses: totalSubmissions - wins,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        productId,
        territoryId
      }
    };
  }

  /**
   * Calculate Sample Efficiency Index
   * Ratio of prescriptions generated per sample distributed (Sample-to-Script effectiveness)
   */
  async calculateSampleEfficiency(params: KPICalculationParams): Promise<KPICalculation> {
    const { organizationId, productId, territoryId, periodStart, periodEnd } = params;

    // Get total samples distributed
    let sampleEffQuery = (this.supabase as any)
      .from('sample_distributions')
      .select('quantity, product_id, territory_id')
      .eq('organization_id', organizationId)
      .gte('distribution_date', periodStart.toISOString())
      .lte('distribution_date', periodEnd.toISOString());
    if (productId) sampleEffQuery = sampleEffQuery.eq('product_id', productId);
    if (territoryId) sampleEffQuery = sampleEffQuery.eq('territory_id', territoryId);
    const { data: sampleData, error: sampleError } = await sampleEffQuery;

    if (sampleError) {
      throw new Error(`Sample distribution calculation failed: ${sampleError.message}`);
    }

  const totalSamples = (sampleData || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0) || 0;

    // Get TRx for the same period (reuse existing method)
    const trxResult = await this.calculateTRx(params);
    const totalPrescriptions = trxResult.value;

    // Calculate efficiency: prescriptions per 100 samples
    const efficiency = totalSamples > 0 ? (totalPrescriptions / totalSamples) * 100 : 0;

    return {
      kpiId: 'sample_efficiency',
      kpiName: 'Sample Efficiency Index',
      value: efficiency,
      confidence: 0.85,
      calculatedAt: new Date(),
      metadata: {
        totalSamples,
        totalPrescriptions,
        efficiencyRatio: totalSamples > 0 ? totalPrescriptions / totalSamples : 0,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        productId,
        territoryId,
        unit: 'Rx per 100 samples'
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
      this.calculateFormularyAccess(params),
      this.calculateKOLEngagement(params),
      this.calculateFormularyWinRate(params),
      this.calculateSampleEfficiency(params)
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
    const { error } = await (this.supabase as any)
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
    filters?: Record<string, unknown>
  ): Promise<KPICalculation | null> {
    const { data, error } = await (this.supabase as any)
      .from('kpi_calculated_values')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('kpi_id', kpiId)
      .eq('calculation_date', new Date().toISOString().split('T')[0])
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])
      .contains('filters', filters || {})
      .single();

    if (error || !data) {
      return null;
    }

    return {
      kpiId: (data as any).kpi_id,
      kpiName: '', // Would need to join with pharmaceutical_kpis table
      value: (data as any).calculated_value,
      confidence: (data as any).confidence_score,
      calculatedAt: new Date((data as any).created_at),
      metadata: (data as any).metadata
    };
  }
}

// Export singleton instance
export const kpiEngine = new KPIEngine();
