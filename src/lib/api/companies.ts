import { createClientComponentClient } from '@/lib/auth'
import { Database } from '@/lib/supabase'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export interface CompanyWithStats extends Company {
  contact_count?: number
  opportunity_count?: number
  total_deal_value?: number
}

export class CompanyAPI {
  private supabase = createClientComponentClient()

  async getCompanies(): Promise<ApiResponse<CompanyWithStats[]>> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select(`
          *,
          contact_count:contacts(count),
          opportunity_count:opportunities(count),
          total_deal_value:opportunities(sum(deal_value))
        `)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getCompany(id: string): Promise<ApiResponse<CompanyWithStats>> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select(`
          *,
          contact_count:contacts(count),
          opportunity_count:opportunities(count),
          total_deal_value:opportunities(sum(deal_value))
        `)
        .eq('id', id)
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createCompany(company: Omit<CompanyInsert, 'organization_id' | 'created_by'>): Promise<ApiResponse<Company>> {
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
        .from('companies')
        .insert({
          ...company,
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

  async updateCompany(id: string, updates: CompanyUpdate): Promise<ApiResponse<Company>> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deleteCompany(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('companies')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async searchCompanies(query: string): Promise<ApiResponse<CompanyWithStats[]>> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select(`
          *,
          contact_count:contacts(count),
          opportunity_count:opportunities(count),
          total_deal_value:opportunities(sum(deal_value))
        `)
        .or(`name.ilike.%${query}%,domain.ilike.%${query}%,industry.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getCompanyContacts(companyId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getCompanyOpportunities(companyId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const companyAPI = new CompanyAPI()