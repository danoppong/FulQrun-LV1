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
      integration_connections: {
        Row: {
          id: string
          organization_id: string
          integration_type: string
          status: string
          config: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          integration_type: string
          status: string
          config: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_type?: string
          status?: string
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          name: string
          description: string
          contact_id: string
          company_id: string
          assigned_to: string
          deal_value: number
          probability: number
          close_date: string
          stage: string
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          contact_id: string
          company_id: string
          assigned_to: string
          deal_value: number
          probability: number
          close_date: string
          stage: string
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          contact_id?: string
          company_id?: string
          assigned_to?: string
          deal_value?: number
          probability?: number
          close_date?: string
          stage?: string
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
          source: string
          status: string
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
          email: string
          phone: string
          company: string
          source: string
          status: string
          score: number
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
          source?: string
          status?: string
          score?: number
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Define the Supabase client type
export type SupabaseClientType = SupabaseClient<Database>

// Define common API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  message?: string
  status?: number
}

// Define common query result types
export interface QueryResult<T = unknown> {
  data: T | null
  error: { message: string } | null
}

// Define pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
