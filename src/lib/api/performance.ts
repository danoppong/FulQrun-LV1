import { createClientComponentClient } from '@/lib/auth'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors'

export interface PerformanceMetric {
  id: string
  user_id: string
  metric_type: 'clarity' | 'score' | 'teach' | 'problem' | 'value' | 'overall'
  metric_name: string
  metric_value: number
  target_value: number | null
  period_start: string
  period_end: string
  calculation_method: string | null
  raw_data: Record<string, any>
  organization_id: string
  created_at: string
  updated_at: string
}

export interface PerformanceSummary {
  overall_score: number
  clarity_score: number
  score_accuracy: number
  teaching_effectiveness: number
  problem_solving: number
  value_communication: number
  trend: 'up' | 'down' | 'stable'
  period_comparison: {
    current_period: number
    previous_period: number
    change_percentage: number
  }
}

export class PerformanceAPI {
  private get supabase() {
    return createClientComponentClient()
  }

  async getPerformanceMetrics(userId: string, period?: string): Promise<ApiResponse<PerformanceMetric[]>> {
    try {
      let query = this.supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (period) {
        query = query.eq('period_start', period)
      }

      const { data, error } = await query

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getPerformanceSummary(userId: string): Promise<ApiResponse<PerformanceSummary>> {
    try {
      // Mock data for now - in real implementation, this would calculate from metrics
      const mockSummary: PerformanceSummary = {
        overall_score: 85,
        clarity_score: 88,
        score_accuracy: 82,
        teaching_effectiveness: 87,
        problem_solving: 83,
        value_communication: 86,
        trend: 'up',
        period_comparison: {
          current_period: 85,
          previous_period: 78,
          change_percentage: 8.97
        }
      }

      return { data: mockSummary, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PerformanceMetric>> {
    try {
      const { data, error } = await this.supabase
        .from('performance_metrics')
        .insert(metric)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updatePerformanceMetric(id: string, updates: Partial<PerformanceMetric>): Promise<ApiResponse<PerformanceMetric>> {
    try {
      const { data, error } = await this.supabase
        .from('performance_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deletePerformanceMetric(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('performance_metrics')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async getTeamPerformanceMetrics(organizationId: string, period?: string): Promise<ApiResponse<PerformanceMetric[]>> {
    try {
      let query = this.supabase
        .from('performance_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (period) {
        query = query.eq('period_start', period)
      }

      const { data, error } = await query

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const performanceAPI = new PerformanceAPI()
