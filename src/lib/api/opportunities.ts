import { createClientComponentClient } from '@/lib/auth'
import { Database } from '@/lib/supabase'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors'

type Opportunity = Database['public']['Tables']['opportunities']['Row']
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

export interface OpportunityWithDetails extends Opportunity {
  contact?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    title: string | null
  } | null
  company?: {
    id: string
    name: string
    domain: string | null
    industry: string | null
  } | null
}

export interface PipelineSummary {
  totalValue: number
  weightedValue: number
  byStage: {
    prospecting: { count: number; value: number; weightedValue: number }
    engaging: { count: number; value: number; weightedValue: number }
    advancing: { count: number; value: number; weightedValue: number }
    key_decision: { count: number; value: number; weightedValue: number }
  }
}

export interface MEDDPICCData {
  metrics?: string | null
  economic_buyer?: string | null
  decision_criteria?: string | null
  decision_process?: string | null
  paper_process?: string | null
  identify_pain?: string | null
  champion?: string | null
  competition?: string | null
}

export class OpportunityAPI {
  private get supabase() {
    return createClientComponentClient()
  }

  async getOpportunities(): Promise<ApiResponse<OpportunityWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          company:companies(id, name, domain, industry)
        `)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getOpportunity(id: string): Promise<ApiResponse<OpportunityWithDetails>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          company:companies(id, name, domain, industry)
        `)
        .eq('id', id)
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createOpportunity(opportunity: Omit<OpportunityInsert, 'organization_id' | 'created_by'>): Promise<ApiResponse<Opportunity>> {
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
        .from('opportunities')
        .insert({
          ...opportunity,
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

  async updateOpportunity(id: string, updates: OpportunityUpdate): Promise<ApiResponse<Opportunity>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deleteOpportunity(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('opportunities')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async searchOpportunities(query: string): Promise<ApiResponse<OpportunityWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          company:companies(id, name, domain, industry)
        `)
        .or(`name.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getOpportunitiesByStage(stage: string): Promise<ApiResponse<OpportunityWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, title),
          company:companies(id, name, domain, industry)
        `)
        .eq('peak_stage', stage)
        .order('created_at', { ascending: false })

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updatePeakStage(id: string, stage: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'): Promise<ApiResponse<Opportunity>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .update({ peak_stage: stage })
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updateMEDDPICC(id: string, meddpiccData: MEDDPICCData): Promise<ApiResponse<Opportunity>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .update(meddpiccData)
        .eq('id', id)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getPipelineSummary(): Promise<ApiResponse<PipelineSummary>> {
    try {
      const { data, error } = await this.supabase
        .from('opportunities')
        .select('peak_stage, deal_value, probability')
        .not('deal_value', 'is', null)

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate pipeline summary
      const summary: PipelineSummary = {
        totalValue: 0,
        weightedValue: 0,
        byStage: {
          prospecting: { count: 0, value: 0, weightedValue: 0 },
          engaging: { count: 0, value: 0, weightedValue: 0 },
          advancing: { count: 0, value: 0, weightedValue: 0 },
          key_decision: { count: 0, value: 0, weightedValue: 0 }
        }
      }

      data?.forEach((opp: any) => {
        const value = opp.deal_value || 0
        const probability = opp.probability || 0
        const weightedValue = value * (probability / 100)

        summary.totalValue += value
        summary.weightedValue += weightedValue

        const stage = opp.peak_stage as keyof typeof summary.byStage
        if (summary.byStage[stage]) {
          summary.byStage[stage].count += 1
          summary.byStage[stage].value += value
          summary.byStage[stage].weightedValue += weightedValue
        }
      })

      return { data: summary, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const opportunityAPI = new OpportunityAPI()