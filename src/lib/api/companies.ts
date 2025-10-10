import { createClientComponentClient } from '@/lib/auth'
import type { Database } from '@/lib/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors';

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export interface CompanyWithStats extends Company {
  contact_count?: number
  opportunity_count?: number
  total_deal_value?: number
  opportunities?: Array<{ deal_value: number | null }>
}

export class CompanyAPI {
  private get supabase() {
    // Cast to typed client so Postgrest generics resolve correctly
    return createClientComponentClient() as unknown as SupabaseClient<Database>
  }

  // Narrow builder for 'companies' to avoid 'any' and TS 'never' issues
  private companiesTable() {
    type Insert = Database['public']['Tables']['companies']['Insert']
    type Update = Database['public']['Tables']['companies']['Update']
    // Postgrest builder minimal surface we need, typed narrowly
    type InsertBuilder = {
      select: () => { single: () => Promise<{ data: Company | null; error: unknown | null }> }
    }
    type UpdateBuilder = {
      eq: (column: 'id', value: string) => { select: () => { single: () => Promise<{ data: Company | null; error: unknown | null }> } }
    }
    interface CompaniesBuilder {
      insert: (values: Insert) => InsertBuilder
      update: (values: Update) => UpdateBuilder
    }
    return (this.supabase.from('companies') as unknown) as CompaniesBuilder
  }

  async getCompanies(): Promise<ApiResponse<CompanyWithStats[]>> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select(`
          *,
          contact_count:contacts(count),
          opportunity_count:opportunities(count),
          opportunities(deal_value)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Normalize counts and aggregate total_deal_value
      type Raw = (CompanyWithStats & {
        contact_count?: number | { count: number }
        opportunity_count?: number | { count: number }
        opportunities?: Array<{ deal_value: number | null }> | null
      })
      const rows = (data ?? []) as unknown as Raw[]
      const companiesWithStats: CompanyWithStats[] = rows.map((company) => ({
        ...company,
        contact_count: typeof company.contact_count === 'number' ? company.contact_count : ((company.contact_count as { count?: number })?.count ?? 0),
        opportunity_count: typeof company.opportunity_count === 'number' ? company.opportunity_count : ((company.opportunity_count as { count?: number })?.count ?? 0),
        total_deal_value: (company.opportunities ?? [])
          .reduce((sum: number, opp) => sum + (opp?.deal_value ?? 0), 0),
      }))

      return { data: companiesWithStats, error: null }
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
          opportunities(deal_value)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate total_deal_value in the application layer
      const raw = data as unknown as CompanyWithStats & { opportunities?: Array<{ deal_value: number | null }> | null }
      const companyWithStats: CompanyWithStats = {
        ...raw,
        total_deal_value: (raw.opportunities ?? []).reduce((sum, opp) => sum + (opp?.deal_value ?? 0), 0),
      }

      return { data: companyWithStats, error: null }
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
        .maybeSingle()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }
      type UserRow = Database['public']['Tables']['users']['Row']
      const orgId: UserRow['organization_id'] = (profile as UserRow).organization_id

      const { data, error } = await this.companiesTable()
        .insert({
          ...company,
          organization_id: orgId,
          created_by: user.id,
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
      const { data, error } = await this.companiesTable()
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
          opportunities(deal_value)
        `)
        .or(`name.ilike.%${query}%,domain.ilike.%${query}%,industry.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate total_deal_value in the application layer and fix count objects
      type Raw = (CompanyWithStats & {
        contact_count?: number | { count: number }
        opportunity_count?: number | { count: number }
        opportunities?: Array<{ deal_value: number | null }> | null
      })
      const rows = (data ?? []) as unknown as Raw[]
      const companiesWithStats: CompanyWithStats[] = rows.map((company) => ({
        ...company,
        contact_count: typeof company.contact_count === 'number' ? company.contact_count : ((company.contact_count as { count?: number })?.count ?? 0),
        opportunity_count: typeof company.opportunity_count === 'number' ? company.opportunity_count : ((company.opportunity_count as { count?: number })?.count ?? 0),
        total_deal_value: (company.opportunities ?? [])
          .reduce((sum: number, opp) => sum + (opp?.deal_value ?? 0), 0),
      }))

      return { data: companiesWithStats, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getCompanyContacts(companyId: string): Promise<ApiResponse<{ id: string; name: string; email?: string; phone?: string; company_id: string }[]>> {
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

  async getCompanyOpportunities(companyId: string): Promise<ApiResponse<{ id: string; name: string; value: number; stage: string; company_id: string }[]>> {
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