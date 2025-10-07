import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/supabase';
import { normalizeError } from '@/lib/utils';

export interface ApiResponse<T> {
  data: T | null
  error: { message: string } | null
}

export interface ICPProfile {
  id: string
  name: string
  description: string | null
  criteria: Record<string, any>
  organization_id: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ICPProfileInsert {
  name: string
  description?: string | null
  criteria?: Record<string, any>
}

export interface ICPProfileUpdate {
  name?: string
  description?: string | null
  criteria?: Record<string, any>
}

export class ICPProfileAPI {
  private get supabase() {
    return createClientComponentClient<Database>()
  }

  /**
   * Get all ICP profiles for the current organization
   */
  async getICPProfiles(): Promise<ApiResponse<ICPProfile[]>> {
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
        .from('icp_profiles')
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
   * Get a specific ICP profile by ID
   */
  async getICPProfile(id: string): Promise<ApiResponse<ICPProfile>> {
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
        .from('icp_profiles')
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
   * Create a new ICP profile
   */
  async createICPProfile(icpProfile: ICPProfileInsert): Promise<ApiResponse<ICPProfile>> {
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
        .from('icp_profiles')
        .insert({
          ...icpProfile,
          organization_id: profile.organization_id,
          created_by: user.id,
          criteria: icpProfile.criteria || {}
        })
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Update an existing ICP profile
   */
  async updateICPProfile(id: string, updates: ICPProfileUpdate): Promise<ApiResponse<ICPProfile>> {
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
        .from('icp_profiles')
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
   * Soft delete an ICP profile
   */
  async deleteICPProfile(id: string): Promise<ApiResponse<void>> {
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
        .from('icp_profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', profile.organization_id)

      return { data: null, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  /**
   * Get ICP profile statistics
   */
  async getICPProfileStats(): Promise<ApiResponse<{
    total_profiles: number
    active_profiles: number
    profiles_with_briefs: number
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

      // Get total profiles
      const { count: totalProfiles } = await this.supabase
        .from('icp_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)

      // Get active profiles (with criteria)
      const { count: activeProfiles } = await this.supabase
        .from('icp_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)
        .not('criteria', 'is', null)

      // Get profiles with briefs
      const { count: profilesWithBriefs } = await this.supabase
        .from('lead_briefs')
        .select('icp_profile_id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('deleted_at', null)

      return {
        data: {
          total_profiles: totalProfiles || 0,
          active_profiles: activeProfiles || 0,
          profiles_with_briefs: profilesWithBriefs || 0
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const icpProfileAPI = new ICPProfileAPI()
