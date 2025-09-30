import { SupabaseClient } from '@supabase/supabase-js'

// Define the database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          domain: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          domain: string
          industry: string
          size: string
          address: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          industry: string
          size: string
          address: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          industry?: string
          size?: string
          address?: string
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          title: string
          company_id: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          title: string
          company_id: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          title?: string
          company_id?: string
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          company: string
          title: string
          source: string
          status: string
          score: number
          ai_score: number
          notes: string
          assigned_to: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          company: string
          title: string
          source: string
          status: string
          score: number
          ai_score: number
          notes: string
          assigned_to: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          company?: string
          title?: string
          source?: string
          status?: string
          score?: number
          ai_score?: number
          notes?: string
          assigned_to?: string
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          name: string
          value: number
          stage: string
          probability: number
          close_date: string
          company_id: string
          contact_id: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          value: number
          stage: string
          probability: number
          close_date: string
          company_id: string
          contact_id: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          value?: number
          stage?: string
          probability?: number
          close_date?: string
          company_id?: string
          contact_id?: string
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: string
          subject: string
          description: string
          due_date: string
          completed: boolean
          opportunity_id: string
          contact_id: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          subject: string
          description: string
          due_date: string
          completed: boolean
          opportunity_id: string
          contact_id: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          subject?: string
          description?: string
          due_date?: string
          completed?: boolean
          opportunity_id?: string
          contact_id?: string
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Sales Performance Module Tables
      sales_territories: {
        Row: {
          id: string
          name: string
          description: string | null
          region: string | null
          zip_codes: string[]
          industry_codes: string[]
          revenue_tier_min: number | null
          revenue_tier_max: number | null
          assigned_user_id: string | null
          manager_id: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          region?: string | null
          zip_codes?: string[]
          industry_codes?: string[]
          revenue_tier_min?: number | null
          revenue_tier_max?: number | null
          assigned_user_id?: string | null
          manager_id?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          region?: string | null
          zip_codes?: string[]
          industry_codes?: string[]
          revenue_tier_min?: number | null
          revenue_tier_max?: number | null
          assigned_user_id?: string | null
          manager_id?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      quota_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          plan_type: 'annual' | 'quarterly' | 'monthly' | 'custom'
          start_date: string
          end_date: string
          target_revenue: number
          target_deals: number
          target_activities: number
          territory_id: string | null
          user_id: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          plan_type: 'annual' | 'quarterly' | 'monthly' | 'custom'
          start_date: string
          end_date: string
          target_revenue?: number
          target_deals?: number
          target_activities?: number
          territory_id?: string | null
          user_id?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          plan_type?: 'annual' | 'quarterly' | 'monthly' | 'custom'
          start_date?: string
          end_date?: string
          target_revenue?: number
          target_deals?: number
          target_activities?: number
          territory_id?: string | null
          user_id?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      compensation_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          plan_type: 'commission_only' | 'salary_plus_commission' | 'bonus_based' | 'hybrid'
          base_salary: number
          commission_rate: number
          commission_cap: number | null
          bonus_thresholds: Record<string, any>
          product_weightings: Record<string, any>
          territory_id: string | null
          user_id: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          plan_type: 'commission_only' | 'salary_plus_commission' | 'bonus_based' | 'hybrid'
          base_salary?: number
          commission_rate?: number
          commission_cap?: number | null
          bonus_thresholds?: Record<string, any>
          product_weightings?: Record<string, any>
          territory_id?: string | null
          user_id?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          plan_type?: 'commission_only' | 'salary_plus_commission' | 'bonus_based' | 'hybrid'
          base_salary?: number
          commission_rate?: number
          commission_cap?: number | null
          bonus_thresholds?: Record<string, any>
          product_weightings?: Record<string, any>
          territory_id?: string | null
          user_id?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          user_id: string
          territory_id: string | null
          quota_plan_id: string | null
          period_start: string
          period_end: string
          revenue_actual: number
          revenue_target: number
          deals_closed: number
          deals_target: number
          activities_completed: number
          activities_target: number
          conversion_rate: number
          pipeline_coverage: number
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          territory_id?: string | null
          quota_plan_id?: string | null
          period_start: string
          period_end: string
          revenue_actual?: number
          revenue_target?: number
          deals_closed?: number
          deals_target?: number
          activities_completed?: number
          activities_target?: number
          conversion_rate?: number
          pipeline_coverage?: number
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          territory_id?: string | null
          quota_plan_id?: string | null
          period_start?: string
          period_end?: string
          revenue_actual?: number
          revenue_target?: number
          deals_closed?: number
          deals_target?: number
          activities_completed?: number
          activities_target?: number
          conversion_rate?: number
          pipeline_coverage?: number
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      commission_calculations: {
        Row: {
          id: string
          user_id: string
          compensation_plan_id: string
          period_start: string
          period_end: string
          base_salary: number
          commission_earned: number
          bonus_earned: number
          total_compensation: number
          quota_attainment: number
          commission_rate_applied: number
          adjustments: Record<string, any>
          status: 'pending' | 'approved' | 'paid' | 'disputed'
          approved_by: string | null
          approved_at: string | null
          payroll_exported: boolean
          payroll_export_date: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          compensation_plan_id: string
          period_start: string
          period_end: string
          base_salary?: number
          commission_earned?: number
          bonus_earned?: number
          total_compensation?: number
          quota_attainment?: number
          commission_rate_applied?: number
          adjustments?: Record<string, any>
          status?: 'pending' | 'approved' | 'paid' | 'disputed'
          approved_by?: string | null
          approved_at?: string | null
          payroll_exported?: boolean
          payroll_export_date?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          compensation_plan_id?: string
          period_start?: string
          period_end?: string
          base_salary?: number
          commission_earned?: number
          bonus_earned?: number
          total_compensation?: number
          quota_attainment?: number
          commission_rate_applied?: number
          adjustments?: Record<string, any>
          status?: 'pending' | 'approved' | 'paid' | 'disputed'
          approved_by?: string | null
          approved_at?: string | null
          payroll_exported?: boolean
          payroll_export_date?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      territory_assignments: {
        Row: {
          id: string
          territory_id: string
          user_id: string
          assigned_by: string
          assignment_date: string
          unassignment_date: string | null
          reason: string | null
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          territory_id: string
          user_id: string
          assigned_by: string
          assignment_date: string
          unassignment_date?: string | null
          reason?: string | null
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          territory_id?: string
          user_id?: string
          assigned_by?: string
          assignment_date?: string
          unassignment_date?: string | null
          reason?: string | null
          organization_id?: string
          created_at?: string
        }
      }
      performance_alerts: {
        Row: {
          id: string
          user_id: string | null
          manager_id: string | null
          alert_type: 'quota_at_risk' | 'quota_exceeded' | 'low_activity' | 'high_performance' | 'commission_dispute'
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          message: string
          threshold_value: number | null
          actual_value: number | null
          is_resolved: boolean
          resolved_by: string | null
          resolved_at: string | null
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          manager_id?: string | null
          alert_type: 'quota_at_risk' | 'quota_exceeded' | 'low_activity' | 'high_performance' | 'commission_dispute'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          title: string
          message: string
          threshold_value?: number | null
          actual_value?: number | null
          is_resolved?: boolean
          resolved_by?: string | null
          resolved_at?: string | null
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          manager_id?: string | null
          alert_type?: 'quota_at_risk' | 'quota_exceeded' | 'low_activity' | 'high_performance' | 'commission_dispute'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          title?: string
          message?: string
          threshold_value?: number | null
          actual_value?: number | null
          is_resolved?: boolean
          resolved_by?: string | null
          resolved_at?: string | null
          organization_id?: string
          created_at?: string
        }
      }
      scenario_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          scenario_type: 'quota_adjustment' | 'territory_redesign' | 'compensation_change' | 'what_if'
          base_scenario_id: string | null
          assumptions: Record<string, any>
          quota_changes: Record<string, any>
          territory_changes: Record<string, any>
          compensation_changes: Record<string, any>
          impact_analysis: Record<string, any>
          budget_variance: number
          fairness_score: number
          is_active: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          scenario_type: 'quota_adjustment' | 'territory_redesign' | 'compensation_change' | 'what_if'
          base_scenario_id?: string | null
          assumptions?: Record<string, any>
          quota_changes?: Record<string, any>
          territory_changes?: Record<string, any>
          compensation_changes?: Record<string, any>
          impact_analysis?: Record<string, any>
          budget_variance?: number
          fairness_score?: number
          is_active?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          scenario_type?: 'quota_adjustment' | 'territory_redesign' | 'compensation_change' | 'what_if'
          base_scenario_id?: string | null
          assumptions?: Record<string, any>
          quota_changes?: Record<string, any>
          territory_changes?: Record<string, any>
          compensation_changes?: Record<string, any>
          impact_analysis?: Record<string, any>
          budget_variance?: number
          fairness_score?: number
          is_active?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales_recognition: {
        Row: {
          id: string
          user_id: string
          recognition_type: 'milestone' | 'achievement' | 'leaderboard' | 'award'
          title: string
          description: string | null
          metric_type: 'revenue' | 'deals' | 'activities' | 'quota_attainment' | null
          metric_value: number | null
          period_start: string | null
          period_end: string | null
          badge_icon: string | null
          points_awarded: number
          is_public: boolean
          awarded_by: string | null
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recognition_type: 'milestone' | 'achievement' | 'leaderboard' | 'award'
          title: string
          description?: string | null
          metric_type?: 'revenue' | 'deals' | 'activities' | 'quota_attainment' | null
          metric_value?: number | null
          period_start?: string | null
          period_end?: string | null
          badge_icon?: string | null
          points_awarded?: number
          is_public?: boolean
          awarded_by?: string | null
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recognition_type?: 'milestone' | 'achievement' | 'leaderboard' | 'award'
          title?: string
          description?: string | null
          metric_type?: 'revenue' | 'deals' | 'activities' | 'quota_attainment' | null
          metric_value?: number | null
          period_start?: string | null
          period_end?: string | null
          badge_icon?: string | null
          points_awarded?: number
          is_public?: boolean
          awarded_by?: string | null
          organization_id?: string
          created_at?: string
        }
      }
      // Enhanced Performance Tracking Tables
      metric_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'revenue' | 'deals' | 'activities' | 'conversion' | 'customer' | 'product' | 'custom'
          metric_type: 'count' | 'percentage' | 'currency' | 'duration' | 'score' | 'ratio'
          unit: string | null
          target_default: number
          is_active: boolean
          is_system: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'revenue' | 'deals' | 'activities' | 'conversion' | 'customer' | 'product' | 'custom'
          metric_type: 'count' | 'percentage' | 'currency' | 'duration' | 'score' | 'ratio'
          unit?: string | null
          target_default?: number
          is_active?: boolean
          is_system?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'revenue' | 'deals' | 'activities' | 'conversion' | 'customer' | 'product' | 'custom'
          metric_type?: 'count' | 'percentage' | 'currency' | 'duration' | 'score' | 'ratio'
          unit?: string | null
          target_default?: number
          is_active?: boolean
          is_system?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      custom_metric_fields: {
        Row: {
          id: string
          metric_template_id: string
          field_name: string
          field_type: 'text' | 'number' | 'date' | 'boolean' | 'select'
          field_options: Record<string, any>
          is_required: boolean
          display_order: number
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          metric_template_id: string
          field_name: string
          field_type: 'text' | 'number' | 'date' | 'boolean' | 'select'
          field_options?: Record<string, any>
          is_required?: boolean
          display_order?: number
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          metric_template_id?: string
          field_name?: string
          field_type?: 'text' | 'number' | 'date' | 'boolean' | 'select'
          field_options?: Record<string, any>
          is_required?: boolean
          display_order?: number
          organization_id?: string
          created_at?: string
        }
      }
      enhanced_performance_metrics: {
        Row: {
          id: string
          metric_template_id: string
          user_id: string
          territory_id: string | null
          quota_plan_id: string | null
          period_start: string
          period_end: string
          actual_value: number
          target_value: number
          custom_fields: Record<string, any>
          notes: string | null
          status: 'active' | 'archived' | 'draft'
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metric_template_id: string
          user_id: string
          territory_id?: string | null
          quota_plan_id?: string | null
          period_start: string
          period_end: string
          actual_value: number
          target_value: number
          custom_fields?: Record<string, any>
          notes?: string | null
          status?: 'active' | 'archived' | 'draft'
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metric_template_id?: string
          user_id?: string
          territory_id?: string | null
          quota_plan_id?: string | null
          period_start?: string
          period_end?: string
          actual_value?: number
          target_value?: number
          custom_fields?: Record<string, any>
          notes?: string | null
          status?: 'active' | 'archived' | 'draft'
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      metric_goals: {
        Row: {
          id: string
          metric_template_id: string
          user_id: string | null
          territory_id: string | null
          goal_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          target_value: number
          stretch_target: number | null
          start_date: string
          end_date: string
          is_active: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metric_template_id: string
          user_id?: string | null
          territory_id?: string | null
          goal_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          target_value: number
          stretch_target?: number | null
          start_date: string
          end_date: string
          is_active?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metric_template_id?: string
          user_id?: string | null
          territory_id?: string | null
          goal_period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          target_value?: number
          stretch_target?: number | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      metric_dashboards: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string | null
          is_shared: boolean
          dashboard_config: Record<string, any>
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id?: string | null
          is_shared?: boolean
          dashboard_config?: Record<string, any>
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string | null
          is_shared?: boolean
          dashboard_config?: Record<string, any>
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      dashboard_metrics: {
        Row: {
          id: string
          dashboard_id: string
          metric_template_id: string
          display_order: number
          chart_type: 'line' | 'bar' | 'pie' | 'area' | 'gauge' | 'table'
          chart_config: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          dashboard_id: string
          metric_template_id: string
          display_order?: number
          chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'gauge' | 'table'
          chart_config?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          dashboard_id?: string
          metric_template_id?: string
          display_order?: number
          chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'gauge' | 'table'
          chart_config?: Record<string, any>
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']