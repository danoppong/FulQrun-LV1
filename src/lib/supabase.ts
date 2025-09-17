import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config'

// Singleton client instance to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = (() => {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  // Only create client if Supabase is configured
  if (supabaseConfig.isConfigured) {
    supabaseInstance = createBrowserClient(
      supabaseConfig.url!, 
      supabaseConfig.anonKey!
    )
  } else {
    // Return a mock client if not configured
    supabaseInstance = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ 
          error: { message: 'Supabase not configured' } 
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          }),
          order: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        insert: (data: any) => {
          const result = { data: null, error: { message: 'Supabase not configured' } }
          const promise = Promise.resolve(result)
          return Object.assign(promise, {
            select: () => ({
              single: async () => result
            })
          })
        },
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            })
          })
        }),
        delete: () => ({
          eq: async () => ({ error: { message: 'Supabase not configured' } })
        })
      })
    } as any
  }
  
  return supabaseInstance
})()

// Server-side client for API routes
export const createServerClient = () => {
  // Only create client if Supabase is configured
  if (supabaseConfig.isConfigured) {
    // For server-side usage, cookies will be handled by the calling component
    return createSupabaseServerClient(supabaseConfig.url!, supabaseConfig.anonKey!, {
      cookies: {
        get(name: string) {
          return undefined // Will be handled by the calling component
        },
        set(name: string, value: string, options: any) {
          // Will be handled by the calling component
        },
        remove(name: string, options: any) {
          // Will be handled by the calling component
        },
      },
    })
  } else {
    // Return a mock client if not configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ 
          error: { message: 'Supabase not configured' } 
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          }),
          order: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        insert: (data: any) => {
          const result = { data: null, error: { message: 'Supabase not configured' } }
          const promise = Promise.resolve(result)
          return Object.assign(promise, {
            select: () => ({
              single: async () => result
            })
          })
        },
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            })
          })
        }),
        delete: () => ({
          eq: async () => ({ error: { message: 'Supabase not configured' } })
        })
      })
    } as any
  }
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = supabaseConfig.isConfigured

// Database types
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'rep' | 'manager' | 'admin'
          organization_id: string
          learning_progress: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'rep' | 'manager' | 'admin'
          organization_id: string
          learning_progress?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'rep' | 'manager' | 'admin'
          organization_id?: string
          learning_progress?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          title: string | null
          company_id: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          title?: string | null
          company_id?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          title?: string | null
          company_id?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          address: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          address?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          address?: string | null
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
          email: string | null
          phone: string | null
          company: string | null
          source: string | null
          status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
          score: number
          ai_score: number
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
          score?: number
          ai_score?: number
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
          score?: number
          ai_score?: number
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
          contact_id: string | null
          company_id: string | null
          peak_stage: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
          meddpicc_score: number
          metrics: string | null
          economic_buyer: string | null
          decision_criteria: string | null
          decision_process: string | null
          paper_process: string | null
          identify_pain: string | null
          implicate_pain: string | null
          champion: string | null
          competition: string | null
          deal_value: number | null
          probability: number | null
          close_date: string | null
          pipeline_config_id: string | null
          ai_risk_score: number
          ai_next_action: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_id?: string | null
          company_id?: string | null
          peak_stage?: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
          meddpicc_score?: number
          metrics?: string | null
          economic_buyer?: string | null
          decision_criteria?: string | null
          decision_process?: string | null
          paper_process?: string | null
          identify_pain?: string | null
          implicate_pain?: string | null
          champion?: string | null
          competition?: string | null
          deal_value?: number | null
          probability?: number | null
          close_date?: string | null
          pipeline_config_id?: string | null
          ai_risk_score?: number
          ai_next_action?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_id?: string | null
          company_id?: string | null
          peak_stage?: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
          meddpicc_score?: number
          metrics?: string | null
          economic_buyer?: string | null
          decision_criteria?: string | null
          decision_process?: string | null
          paper_process?: string | null
          identify_pain?: string | null
          implicate_pain?: string | null
          champion?: string | null
          competition?: string | null
          deal_value?: number | null
          probability?: number | null
          close_date?: string | null
          pipeline_config_id?: string | null
          ai_risk_score?: number
          ai_next_action?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: 'email' | 'call' | 'meeting' | 'task'
          subject: string
          description: string | null
          contact_id: string | null
          opportunity_id: string | null
          due_date: string | null
          status: 'pending' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high'
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'email' | 'call' | 'meeting' | 'task'
          subject: string
          description?: string | null
          contact_id?: string | null
          opportunity_id?: string | null
          due_date?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'email' | 'call' | 'meeting' | 'task'
          subject?: string
          description?: string | null
          contact_id?: string | null
          opportunity_id?: string | null
          due_date?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          type: 'microsoft_graph' | 'quickbooks'
          name: string
          config: Record<string, any>
          is_active: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'microsoft_graph' | 'quickbooks'
          name: string
          config: Record<string, any>
          is_active?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'microsoft_graph' | 'quickbooks'
          name?: string
          config?: Record<string, any>
          is_active?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      pipeline_configurations: {
        Row: {
          id: string
          name: string
          description: string | null
          stages: Record<string, any>[]
          branch_specific: boolean
          role_specific: boolean
          branch_name: string | null
          role_name: string | null
          is_default: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          stages?: Record<string, any>[]
          branch_specific?: boolean
          role_specific?: boolean
          branch_name?: string | null
          role_name?: string | null
          is_default?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          stages?: Record<string, any>[]
          branch_specific?: boolean
          role_specific?: boolean
          branch_name?: string | null
          role_name?: string | null
          is_default?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      workflow_automations: {
        Row: {
          id: string
          name: string
          description: string | null
          trigger_type: 'stage_change' | 'field_update' | 'time_based' | 'manual'
          trigger_conditions: Record<string, any>
          actions: Record<string, any>[]
          is_active: boolean
          branch_specific: boolean
          role_specific: boolean
          branch_name: string | null
          role_name: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          trigger_type: 'stage_change' | 'field_update' | 'time_based' | 'manual'
          trigger_conditions?: Record<string, any>
          actions?: Record<string, any>[]
          is_active?: boolean
          branch_specific?: boolean
          role_specific?: boolean
          branch_name?: string | null
          role_name?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          trigger_type?: 'stage_change' | 'field_update' | 'time_based' | 'manual'
          trigger_conditions?: Record<string, any>
          actions?: Record<string, any>[]
          is_active?: boolean
          branch_specific?: boolean
          role_specific?: boolean
          branch_name?: string | null
          role_name?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
          entity_type: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization'
          entity_id: string
          insight_data: Record<string, any>
          confidence_score: number | null
          model_version: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
          entity_type: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization'
          entity_id: string
          insight_data?: Record<string, any>
          confidence_score?: number | null
          model_version?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'lead_scoring' | 'deal_risk' | 'next_action' | 'forecasting' | 'performance'
          entity_type?: 'lead' | 'opportunity' | 'contact' | 'user' | 'organization'
          entity_id?: string
          insight_data?: Record<string, any>
          confidence_score?: number | null
          model_version?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      learning_modules: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string
          module_type: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
          duration_minutes: number | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          tags: string[]
          prerequisites: string[]
          certification_required: boolean
          is_active: boolean
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: string
          module_type: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
          duration_minutes?: number | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          tags?: string[]
          prerequisites?: string[]
          certification_required?: boolean
          is_active?: boolean
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string
          module_type?: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
          duration_minutes?: number | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          tags?: string[]
          prerequisites?: string[]
          certification_required?: boolean
          is_active?: boolean
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      integration_connections: {
        Row: {
          id: string
          integration_type: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
          name: string
          config: Record<string, any>
          credentials: Record<string, any>
          is_active: boolean
          last_sync_at: string | null
          sync_status: 'pending' | 'success' | 'error' | 'disabled'
          error_message: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          integration_type: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
          name: string
          config?: Record<string, any>
          credentials?: Record<string, any>
          is_active?: boolean
          last_sync_at?: string | null
          sync_status?: 'pending' | 'success' | 'error' | 'disabled'
          error_message?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          integration_type?: 'slack' | 'docusign' | 'stripe' | 'gong' | 'sharepoint' | 'salesforce' | 'hubspot'
          name?: string
          config?: Record<string, any>
          credentials?: Record<string, any>
          is_active?: boolean
          last_sync_at?: string | null
          sync_status?: 'pending' | 'success' | 'error' | 'disabled'
          error_message?: string | null
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
        Insert: {
          id?: string
          user_id: string
          metric_type: 'clarity' | 'score' | 'teach' | 'problem' | 'value' | 'overall'
          metric_name: string
          metric_value: number
          target_value?: number | null
          period_start: string
          period_end: string
          calculation_method?: string | null
          raw_data?: Record<string, any>
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_type?: 'clarity' | 'score' | 'teach' | 'problem' | 'value' | 'overall'
          metric_name?: string
          metric_value?: number
          target_value?: number | null
          period_start?: string
          period_end?: string
          calculation_method?: string | null
          raw_data?: Record<string, any>
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_learning_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'certified'
          progress_percentage: number
          time_spent_minutes: number
          last_accessed_at: string | null
          completed_at: string | null
          certification_date: string | null
          quiz_scores: Record<string, any>
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'certified'
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed_at?: string | null
          completed_at?: string | null
          certification_date?: string | null
          quiz_scores?: Record<string, any>
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'certified'
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed_at?: string | null
          completed_at?: string | null
          certification_date?: string | null
          quiz_scores?: Record<string, any>
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sharepoint_documents: {
        Row: {
          id: string
          opportunity_id: string | null
          stage_name: string
          document_name: string
          document_type: string
          sharepoint_url: string
          local_path: string | null
          file_size: number | null
          is_required: boolean
          is_completed: boolean
          uploaded_by: string | null
          uploaded_at: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id?: string | null
          stage_name: string
          document_name: string
          document_type: string
          sharepoint_url: string
          local_path?: string | null
          file_size?: number | null
          is_required?: boolean
          is_completed?: boolean
          uploaded_by?: string | null
          uploaded_at?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string | null
          stage_name?: string
          document_name?: string
          document_type?: string
          sharepoint_url?: string
          local_path?: string | null
          file_size?: number | null
          is_required?: boolean
          is_completed?: boolean
          uploaded_by?: string | null
          uploaded_at?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string
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
