import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

export const supabase = createClient(
  supabaseConfig.url || 'https://placeholder.supabase.co', 
  supabaseConfig.anonKey || 'placeholder_key'
)

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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'rep' | 'manager' | 'admin'
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'rep' | 'manager' | 'admin'
          organization_id?: string
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
          champion: string | null
          competition: string | null
          deal_value: number | null
          probability: number | null
          close_date: string | null
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
          champion?: string | null
          competition?: string | null
          deal_value?: number | null
          probability?: number | null
          close_date?: string | null
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
          champion?: string | null
          competition?: string | null
          deal_value?: number | null
          probability?: number | null
          close_date?: string | null
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
