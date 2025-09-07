import { createClientComponentClient } from '@/lib/auth'
import { Database } from '@/lib/supabase'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export interface ContactWithCompany extends Contact {
  company?: {
    id: string
    name: string
    domain: string | null
    industry: string | null
  } | null
}

export class ContactAPI {
  private supabase = createClientComponentClient()

  async getContacts(): Promise<ApiResponse<ContactWithCompany[]>> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select(`
          *,
          company:companies(id, name, domain, industry)
        `)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getContact(id: string): Promise<ApiResponse<ContactWithCompany>> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select(`
          *,
          company:companies(id, name, domain, industry)
        `)
        .eq('id', id)
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createContact(contact: Omit<ContactInsert, 'organization_id' | 'created_by'>): Promise<ApiResponse<Contact>> {
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
        .from('contacts')
        .insert({
          ...contact,
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

  async updateContact(id: string, updates: ContactUpdate): Promise<ApiResponse<Contact>> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deleteContact(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async searchContacts(query: string): Promise<ApiResponse<ContactWithCompany[]>> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select(`
          *,
          company:companies(id, name, domain, industry)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const contactAPI = new ContactAPI()