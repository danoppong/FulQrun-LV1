import { createClientComponentClient } from '@/lib/auth'
import { Database } from '@/lib/supabase'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors';

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

export interface ActivityWithDetails extends Activity {
  contact?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    title: string | null
  } | null
  opportunity?: {
    id: string
    name: string
  } | null
  created_by_user?: {
    id: string
    full_name: string | null
    email: string
  } | null
}

export interface ActivityFormData {
  type: 'email' | 'call' | 'meeting' | 'task'
  subject: string
  description?: string
  contact_id?: string | null
  opportunity_id?: string | null
  due_date?: string | null
  status?: 'pending' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
}

export class ActivityAPI {
  private get supabase() {
    return createClientComponentClient()
  }

  async getActivities(opportunityId?: string): Promise<ApiResponse<ActivityWithDetails[]>> {
    try {
      let query = this.supabase
        .from('activities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          opportunity:opportunities(id, name),
          created_by_user:users(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId)
      }

      const { data, error } = await query

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getActivity(id: string): Promise<ApiResponse<ActivityWithDetails>> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          opportunity:opportunities(id, name),
          created_by_user:users(id, full_name, email)
        `)
        .eq('id', id)
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createActivity(activity: Omit<ActivityInsert, 'organization_id' | 'created_by'>): Promise<ApiResponse<Activity>> {
    try {
      // Get current user and organization
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user profile to get organization_id
      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      const { data, error } = await this.supabase
        .from('activities')
        .insert({
          ...activity,
          organization_id: profile.organization_id,
          created_by: user.id
        })
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updateActivity(id: string, updates: ActivityUpdate): Promise<ApiResponse<Activity>> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deleteActivity(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('activities')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async getActivitiesByContact(contactId: string): Promise<ApiResponse<ActivityWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          opportunity:opportunities(id, name),
          created_by_user:users(id, full_name, email)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getActivitiesByType(type: 'email' | 'call' | 'meeting' | 'task'): Promise<ApiResponse<ActivityWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          opportunity:opportunities(id, name),
          created_by_user:users(id, full_name, email)
        `)
        .eq('type', type)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const activityAPI = new ActivityAPI()
