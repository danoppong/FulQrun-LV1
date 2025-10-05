'use client';

import { createClient } from '@/lib/supabase/client';

export interface KPIDataIntegrationService {
  syncOpportunityData(opportunityId: string): Promise<void>;
  syncActivityData(activityId: string): Promise<void>;
  syncLeadData(leadId: string): Promise<void>;
  recalculateKPIs(organizationId: string, userId?: string, territoryId?: string): Promise<void>;
  scheduleKPICalculation(organizationId: string, frequency: 'hourly' | 'daily' | 'weekly'): Promise<void>;
  validateDataConsistency(organizationId: string): Promise<DataConsistencyReport>;
}

export interface DataConsistencyReport {
  totalRecords: number;
  inconsistentRecords: number;
  issues: DataIssue[];
  recommendations: string[];
}

export interface DataIssue {
  type: 'missing_data' | 'invalid_data' | 'calculation_error' | 'sync_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: number;
  suggestedFix: string;
}

export class KPIDataIntegrationService implements KPIDataIntegrationService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Sync opportunity data and trigger KPI recalculation
   */
  async syncOpportunityData(opportunityId: string): Promise<void> {
    try {
      // Get opportunity data
      const { data: opportunity, error: oppError } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          assigned_to,
          organization_id,
          companies!inner(
            sales_territories!inner(
              id,
              assigned_user_id
            )
          )
        `)
        .eq('id', opportunityId)
        .single();

      if (oppError || !opportunity) {
        throw new Error(`Failed to fetch opportunity: ${oppError?.message}`);
      }

      // Determine affected users and territories
      const affectedUsers = [opportunity.assigned_to].filter(Boolean);
      const affectedTerritories = opportunity.companies?.sales_territories?.map((t: any) => t.id) || [];

      // Trigger KPI recalculation for affected users/territories
      await this.recalculateKPIs(
        opportunity.organization_id,
        undefined, // Recalculate for all users in organization
        undefined  // Recalculate for all territories
      );

      // Update specific KPI metrics
      await this.updateWinRateMetrics(opportunity);
      await this.updateRevenueGrowthMetrics(opportunity);
      await this.updateDealSizeMetrics(opportunity);
      await this.updateSalesCycleMetrics(opportunity);
      await this.updateQuotaAttainmentMetrics(opportunity);
      await this.updatePipelineCoverageMetrics(opportunity);

      console.log(`Successfully synced opportunity data for opportunity ${opportunityId}`);
    } catch (error) {
      console.error('Error syncing opportunity data:', error);
      throw error;
    }
  }

  /**
   * Sync activity data and trigger KPI recalculation
   */
  async syncActivityData(activityId: string): Promise<void> {
    try {
      // Get activity data
      const { data: activity, error: actError } = await this.supabase
        .from('activities')
        .select(`
          *,
          assigned_to,
          organization_id,
          users!inner(
            sales_territories!inner(
              id,
              assigned_user_id
            )
          )
        `)
        .eq('id', activityId)
        .single();

      if (actError || !activity) {
        throw new Error(`Failed to fetch activity: ${actError?.message}`);
      }

      // Update activities per rep metrics
      await this.updateActivitiesPerRepMetrics(activity);

      // Trigger KPI recalculation for the user
      await this.recalculateKPIs(
        activity.organization_id,
        activity.assigned_to,
        activity.users?.sales_territories?.[0]?.id
      );

      console.log(`Successfully synced activity data for activity ${activityId}`);
    } catch (error) {
      console.error('Error syncing activity data:', error);
      throw error;
    }
  }

  /**
   * Sync lead data and trigger KPI recalculation
   */
  async syncLeadData(leadId: string): Promise<void> {
    try {
      // Get lead data
      const { data: lead, error: leadError } = await this.supabase
        .from('leads')
        .select(`
          *,
          created_by,
          organization_id,
          users!inner(
            sales_territories!inner(
              id,
              assigned_user_id
            )
          )
        `)
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        throw new Error(`Failed to fetch lead: ${leadError?.message}`);
      }

      // Update lead conversion metrics
      await this.updateLeadConversionMetrics(lead);

      // Trigger KPI recalculation for the user
      await this.recalculateKPIs(
        lead.organization_id,
        lead.created_by,
        lead.users?.sales_territories?.[0]?.id
      );

      console.log(`Successfully synced lead data for lead ${leadId}`);
    } catch (error) {
      console.error('Error syncing lead data:', error);
      throw error;
    }
  }

  /**
   * Recalculate KPIs for specific organization, user, or territory
   */
  async recalculateKPIs(organizationId: string, userId?: string, territoryId?: string): Promise<void> {
    try {
      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const periodEnd = new Date().toISOString().split('T')[0];

      // Calculate all KPIs using the master function
      const { data: kpiData, error: kpiError } = await this.supabase.rpc('calculate_all_kpis', {
        p_organization_id: organizationId,
        p_user_id: userId || null,
        p_territory_id: territoryId || null,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

      if (kpiError) {
        throw new Error(`Failed to calculate KPIs: ${kpiError.message}`);
      }

      // Store calculated values in cache
      await this.storeKPICalculatedValues(organizationId, kpiData, periodStart, periodEnd);

      console.log(`Successfully recalculated KPIs for organization ${organizationId}`);
    } catch (error) {
      console.error('Error recalculating KPIs:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic KPI calculation
   */
  async scheduleKPICalculation(organizationId: string, frequency: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    try {
      // This would typically integrate with a job scheduler like cron or a queue system
      // For now, we'll store the schedule preference in the database
      const { error } = await this.supabase
        .from('kpi_definitions')
        .upsert({
          organization_id: organizationId,
          kpi_name: 'calculation_schedule',
          display_name: 'Calculation Schedule',
          description: 'Automatic KPI calculation schedule',
          formula: frequency,
          calculation_method: 'scheduled',
          data_sources: ['opportunities', 'activities', 'leads'],
          dimensions: ['organization', 'user', 'territory'],
          thresholds: {},
          industry_benchmarks: {}
        });

      if (error) {
        throw new Error(`Failed to schedule KPI calculation: ${error.message}`);
      }

      console.log(`Successfully scheduled ${frequency} KPI calculation for organization ${organizationId}`);
    } catch (error) {
      console.error('Error scheduling KPI calculation:', error);
      throw error;
    }
  }

  /**
   * Validate data consistency across all KPI-related tables
   */
  async validateDataConsistency(organizationId: string): Promise<DataConsistencyReport> {
    const issues: DataIssue[] = [];
    let totalRecords = 0;
    let inconsistentRecords = 0;

    try {
      // Check opportunities data consistency
      const oppIssues = await this.validateOpportunitiesData(organizationId);
      issues.push(...oppIssues);

      // Check activities data consistency
      const actIssues = await this.validateActivitiesData(organizationId);
      issues.push(...actIssues);

      // Check leads data consistency
      const leadIssues = await this.validateLeadsData(organizationId);
      issues.push(...leadIssues);

      // Check KPI calculated values consistency
      const kpiIssues = await this.validateKPICalculatedValues(organizationId);
      issues.push(...kpiIssues);

      // Calculate totals
      totalRecords = await this.getTotalRecordCount(organizationId);
      inconsistentRecords = issues.reduce((sum, issue) => sum + issue.affectedRecords, 0);

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);

      return {
        totalRecords,
        inconsistentRecords,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error validating data consistency:', error);
      throw error;
    }
  }

  // Private helper methods

  private async updateWinRateMetrics(opportunity: any): Promise<void> {
    if (opportunity.stage === 'closed_won' || opportunity.stage === 'closed_lost') {
      const { error } = await this.supabase
        .from('win_rate_metrics')
        .upsert({
          organization_id: opportunity.organization_id,
          user_id: opportunity.assigned_to,
          territory_id: opportunity.companies?.sales_territories?.[0]?.id,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          total_opportunities: 1,
          won_opportunities: opportunity.stage === 'closed_won' ? 1 : 0,
          win_rate: opportunity.stage === 'closed_won' ? 100 : 0,
          performance_tier: opportunity.stage === 'closed_won' ? 'excellent' : 'below_average'
        });

      if (error) {
        console.error('Error updating win rate metrics:', error);
      }
    }
  }

  private async updateRevenueGrowthMetrics(opportunity: any): Promise<void> {
    if (opportunity.stage === 'closed_won' && opportunity.deal_value) {
      const { error } = await this.supabase
        .from('revenue_growth_metrics')
        .upsert({
          organization_id: opportunity.organization_id,
          user_id: opportunity.assigned_to,
          territory_id: opportunity.companies?.sales_territories?.[0]?.id,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          current_period_revenue: opportunity.deal_value,
          previous_period_revenue: 0,
          growth_amount: opportunity.deal_value,
          growth_percentage: 100,
          performance_tier: 'excellent'
        });

      if (error) {
        console.error('Error updating revenue growth metrics:', error);
      }
    }
  }

  private async updateDealSizeMetrics(opportunity: any): Promise<void> {
    if (opportunity.stage === 'closed_won' && opportunity.deal_value) {
      const { error } = await this.supabase
        .from('avg_deal_size_metrics')
        .upsert({
          organization_id: opportunity.organization_id,
          user_id: opportunity.assigned_to,
          territory_id: opportunity.companies?.sales_territories?.[0]?.id,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          total_revenue: opportunity.deal_value,
          total_deals: 1,
          avg_deal_size: opportunity.deal_value,
          median_deal_size: opportunity.deal_value,
          largest_deal: opportunity.deal_value,
          smallest_deal: opportunity.deal_value,
          performance_tier: opportunity.deal_value > 150000 ? 'excellent' : 'good'
        });

      if (error) {
        console.error('Error updating deal size metrics:', error);
      }
    }
  }

  private async updateSalesCycleMetrics(opportunity: any): Promise<void> {
    if (opportunity.stage === 'closed_won' && opportunity.close_date) {
      const cycleLength = Math.ceil((new Date(opportunity.close_date).getTime() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      const { error } = await this.supabase
        .from('sales_cycle_metrics')
        .upsert({
          organization_id: opportunity.organization_id,
          user_id: opportunity.assigned_to,
          territory_id: opportunity.companies?.sales_territories?.[0]?.id,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          total_days: cycleLength,
          total_deals: 1,
          avg_cycle_length: cycleLength,
          median_cycle_length: cycleLength,
          shortest_cycle: cycleLength,
          longest_cycle: cycleLength,
          performance_tier: cycleLength < 60 ? 'excellent' : cycleLength < 90 ? 'good' : 'average'
        });

      if (error) {
        console.error('Error updating sales cycle metrics:', error);
      }
    }
  }

  private async updateQuotaAttainmentMetrics(opportunity: any): Promise<void> {
    if (opportunity.stage === 'closed_won' && opportunity.deal_value) {
      const { error } = await this.supabase
        .from('quota_attainment_metrics')
        .upsert({
          organization_id: opportunity.organization_id,
          user_id: opportunity.assigned_to,
          territory_id: opportunity.companies?.sales_territories?.[0]?.id,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          quota_target: 100000, // Default quota - would come from quota_plans
          actual_achievement: opportunity.deal_value,
          attainment_percentage: (opportunity.deal_value / 100000) * 100,
          performance_tier: opportunity.deal_value >= 100000 ? 'excellent' : 'good'
        });

      if (error) {
        console.error('Error updating quota attainment metrics:', error);
      }
    }
  }

  private async updatePipelineCoverageMetrics(opportunity: any): Promise<void> {
    // This would calculate pipeline coverage based on all opportunities
    // Implementation would be similar to other metrics
  }

  private async updateActivitiesPerRepMetrics(activity: any): Promise<void> {
    const { error } = await this.supabase
      .from('activities_per_rep_metrics')
      .upsert({
        organization_id: activity.organization_id,
        user_id: activity.assigned_to,
        territory_id: activity.users?.sales_territories?.[0]?.id,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        total_activities: 1,
        calls: activity.type === 'call' ? 1 : 0,
        emails: activity.type === 'email' ? 1 : 0,
        meetings: activity.type === 'meeting' ? 1 : 0,
        demos: activity.type === 'demo' ? 1 : 0,
        presentations: activity.type === 'presentation' ? 1 : 0,
        activities_per_day: 1,
        performance_tier: 'good'
      });

    if (error) {
      console.error('Error updating activities per rep metrics:', error);
    }
  }

  private async updateLeadConversionMetrics(lead: any): Promise<void> {
    const { error } = await this.supabase
      .from('lead_conversion_metrics')
      .upsert({
        organization_id: lead.organization_id,
        user_id: lead.created_by,
        territory_id: lead.users?.sales_territories?.[0]?.id,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        total_leads: 1,
        qualified_opportunities: lead.status === 'qualified' ? 1 : 0,
        conversion_rate: lead.status === 'qualified' ? 100 : 0,
        performance_tier: lead.status === 'qualified' ? 'excellent' : 'average'
      });

    if (error) {
      console.error('Error updating lead conversion metrics:', error);
    }
  }

  private async storeKPICalculatedValues(organizationId: string, kpiData: any, periodStart: string, periodEnd: string): Promise<void> {
    // Store calculated KPI values in cache for performance
    const kpiNames = Object.keys(kpiData).filter(key => key !== 'calculation_metadata');
    
    for (const kpiName of kpiNames) {
      const { error } = await this.supabase
        .from('kpi_calculated_values')
        .upsert({
          organization_id: organizationId,
          kpi_id: kpiName, // This would be the actual KPI definition ID
          calculated_value: this.extractKPIValue(kpiData[kpiName], kpiName),
          calculation_date: new Date().toISOString().split('T')[0],
          period_start: periodStart,
          period_end: periodEnd,
          filters: {},
          metadata: {},
          confidence_score: 1.0
        });

      if (error) {
        console.error(`Error storing ${kpiName} calculated value:`, error);
      }
    }
  }

  private extractKPIValue(data: any, kpiName: string): number {
    switch (kpiName) {
      case 'win_rate':
        return data.win_rate || 0;
      case 'revenue_growth':
        return data.growth_percentage || 0;
      case 'avg_deal_size':
        return data.avg_deal_size || 0;
      case 'sales_cycle_length':
        return data.avg_cycle_length || 0;
      case 'lead_conversion_rate':
        return data.conversion_rate || 0;
      case 'cac':
        return data.cac || 0;
      case 'quota_attainment':
        return data.attainment_percentage || 0;
      case 'clv':
        return data.clv || 0;
      case 'pipeline_coverage':
        return data.coverage_ratio || 0;
      case 'activities_per_rep':
        return data.activities_per_day || 0;
      default:
        return 0;
    }
  }

  private async validateOpportunitiesData(organizationId: string): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    // Check for opportunities without assigned users
    const { data: unassignedOpps } = await this.supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .is('assigned_to', null);

    if (unassignedOpps && unassignedOpps.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        description: 'Opportunities without assigned users',
        affectedRecords: unassignedOpps.length,
        suggestedFix: 'Assign users to all opportunities or update assignment logic'
      });
    }

    // Check for opportunities without deal values
    const { data: noValueOpps } = await this.supabase
      .from('opportunities')
      .select('id')
      .eq('organization_id', organizationId)
      .is('deal_value', null);

    if (noValueOpps && noValueOpps.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'high',
        description: 'Opportunities without deal values',
        affectedRecords: noValueOpps.length,
        suggestedFix: 'Add deal values to all opportunities for accurate KPI calculations'
      });
    }

    return issues;
  }

  private async validateActivitiesData(organizationId: string): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    // Check for activities without assigned users
    const { data: unassignedActs } = await this.supabase
      .from('activities')
      .select('id')
      .eq('organization_id', organizationId)
      .is('assigned_to', null);

    if (unassignedActs && unassignedActs.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        description: 'Activities without assigned users',
        affectedRecords: unassignedActs.length,
        suggestedFix: 'Assign users to all activities for proper tracking'
      });
    }

    return issues;
  }

  private async validateLeadsData(organizationId: string): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    // Check for leads without creators
    const { data: noCreatorLeads } = await this.supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .is('created_by', null);

    if (noCreatorLeads && noCreatorLeads.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'high',
        description: 'Leads without creators',
        affectedRecords: noCreatorLeads.length,
        suggestedFix: 'Assign creators to all leads for proper attribution'
      });
    }

    return issues;
  }

  private async validateKPICalculatedValues(organizationId: string): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    // Check for stale KPI calculated values
    const staleDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: staleValues } = await this.supabase
      .from('kpi_calculated_values')
      .select('id')
      .eq('organization_id', organizationId)
      .lt('calculation_date', staleDate);

    if (staleValues && staleValues.length > 0) {
      issues.push({
        type: 'sync_error',
        severity: 'medium',
        description: 'Stale KPI calculated values',
        affectedRecords: staleValues.length,
        suggestedFix: 'Recalculate KPIs to ensure data freshness'
      });
    }

    return issues;
  }

  private async getTotalRecordCount(organizationId: string): Promise<number> {
    const { count: oppCount } = await this.supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: actCount } = await this.supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: leadCount } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return (oppCount || 0) + (actCount || 0) + (leadCount || 0);
  }

  private generateRecommendations(issues: DataIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const highIssues = issues.filter(issue => issue.severity === 'high');
    const mediumIssues = issues.filter(issue => issue.severity === 'medium');

    if (criticalIssues.length > 0) {
      recommendations.push('Address critical data issues immediately to ensure accurate KPI calculations');
    }

    if (highIssues.length > 0) {
      recommendations.push('Resolve high-priority data issues to improve data quality');
    }

    if (mediumIssues.length > 0) {
      recommendations.push('Consider addressing medium-priority issues for better data consistency');
    }

    if (issues.length === 0) {
      recommendations.push('Data consistency is good. Continue monitoring for any issues.');
    }

    recommendations.push('Implement automated data validation checks to prevent future issues');
    recommendations.push('Schedule regular KPI recalculations to maintain data freshness');

    return recommendations;
  }
}

// Export singleton instance
export const kpiDataIntegrationService = new KPIDataIntegrationService();
