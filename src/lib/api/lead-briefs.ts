import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/supabase';
import { normalizeError } from '@/lib/utils';

export interface ApiResponse<T> {
  data: T | null
  error: { message: string } | null
}

export interface LeadBrief {
  id: string
  lead_type: 'account' | 'contact'
  geography: 'US' | 'EU' | 'UK' | 'APAC'
  industry: string | null
  revenue_band: string | null
  employee_band: string | null
  entity_type: 'PUBLIC' | 'PRIVATE' | 'NONPROFIT' | 'OTHER'
  technographics: string[]
  installed_tools_hints: string[]
  intent_keywords: string[]
  time_horizon: string | null
  notes: string | null
  icp_profile_id: string
  status: 'draft' | 'submitted' | 'orchestrated'
  organization_id: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LeadBriefInsert {
  lead_type: 'account' | 'contact'
  geography: 'US' | 'EU' | 'UK' | 'APAC'
  industry?: string | null
  revenue_band?: string | null
  employee_band?: string | null
  entity_type: 'PUBLIC' | 'PRIVATE' | 'NONPROFIT' | 'OTHER'
  technographics?: string[]
  installed_tools_hints?: string[]
  intent_keywords?: string[]
  time_horizon?: string | null
  notes?: string | null
  icp_profile_id: string
}

export interface LeadBriefUpdate {
  lead_type?: 'account' | 'contact'
  geography?: 'US' | 'EU' | 'UK' | 'APAC'
  industry?: string | null
  revenue_band?: string | null
  employee_band?: string | null
  entity_type?: 'PUBLIC' | 'PRIVATE' | 'NONPROFIT' | 'OTHER'
  technographics?: string[]
  installed_tools_hints?: string[]
  intent_keywords?: string[]
  time_horizon?: string | null
  notes?: string | null
  icp_profile_id?: string
  status?: 'draft' | 'submitted' | 'orchestrated'
}

export class LeadBriefAPI {
  private get supabase() {
    return createClientComponentClient<Database>()
  }

  /**
   * Get all lead briefs for the current organization
   */
  async getLeadBriefs(): Promise<ApiResponse<LeadBrief[]>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { data, error } = await this.supabase
        .from('lead_briefs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Get a specific lead brief by ID
   */
  async getLeadBrief(id: string): Promise<ApiResponse<LeadBrief>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { data, error } = await this.supabase
        .from('lead_briefs')
        .select('*')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Create a new lead brief
   */
  async createLeadBrief(leadBrief: LeadBriefInsert): Promise<ApiResponse<LeadBrief>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { data, error } = await this.supabase
        .from('lead_briefs')
        .insert({
          ...leadBrief,
          organization_id: profile.organization_id,
          created_by: user.id,
          technographics: leadBrief.technographics || [],
          installed_tools_hints: leadBrief.installed_tools_hints || [],
          intent_keywords: leadBrief.intent_keywords || []
        })
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Update an existing lead brief
   */
  async updateLeadBrief(id: string, updates: LeadBriefUpdate): Promise<ApiResponse<LeadBrief>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { data, error } = await this.supabase
        .from('lead_briefs')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Soft delete a lead brief
   */
  async deleteLeadBrief(id: string): Promise<ApiResponse<void>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { error } = await this.supabase
        .from('lead_briefs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', profile.organization_id)

      return { data: null, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Submit a lead brief for AI processing
   */
  async submitLeadBrief(id: string): Promise<ApiResponse<LeadBrief>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Update status to submitted
      const { data, error } = await this.supabase
        .from('lead_briefs')
        .update({ status: 'submitted' })
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Get lead brief statistics
   */
  async getLeadBriefStats(): Promise<ApiResponse<{
    total_briefs: number
    draft_briefs: number
    submitted_briefs: number
    orchestrated_briefs: number
  }>> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user organization
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Get total briefs
      const { count: totalBriefs } = await this.supabase
        .from('lead_briefs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)

      // Get briefs by status
      const { count: draftBriefs } = await this.supabase
        .from('lead_briefs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'draft')
        .eq('deleted_at', null)

      const { count: submittedBriefs } = await this.supabase
        .from('lead_briefs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'submitted')
        .eq('deleted_at', null)

      const { count: orchestratedBriefs } = await this.supabase
        .from('lead_briefs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'orchestrated')
        .eq('deleted_at', null)

      return {
        data: {
          total_briefs: totalBriefs || 0,
          draft_briefs: draftBriefs || 0,
          submitted_briefs: submittedBriefs || 0,
          orchestrated_briefs: orchestratedBriefs || 0
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const leadBriefAPI = new LeadBriefAPI()
