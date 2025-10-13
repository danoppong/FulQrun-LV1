import { createClientComponentClient } from '@/lib/auth'
import type { Database } from '@/lib/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { leadScoringEngine, LeadData, LeadScore } from '@/lib/scoring/leadScoring'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors';

type Lead = Database['public']['Tables']['leads']['Row']
type LeadInsert = Database['public']['Tables']['leads']['Insert']
type LeadUpdate = Database['public']['Tables']['leads']['Update']

export interface LeadWithScore extends Lead {
  score_breakdown?: LeadScore
}

export interface LeadStats {
  total: number
  byStatus: {
    new: number
    contacted: number
    qualified: number
    converted: number
    closed: number
  }
  byScore: {
    hot: number
    warm: number
    cool: number
    cold: number
  }
}

export class LeadAPI {
  private get supabase() {
    // Ensure the client carries Database typing so table generics are inferred
    return createClientComponentClient() as unknown as SupabaseClient<Database>
  }

  // Narrow builder for 'leads' to avoid TS 'never' issues on insert/update
  private leadsTable() {
    type Insert = Database['public']['Tables']['leads']['Insert']
    type Update = Database['public']['Tables']['leads']['Update']
    type InsertBuilder = {
      select: () => { single: () => Promise<{ data: Lead | null; error: unknown | null }> }
    }
    type UpdateBuilder = {
      eq: (column: 'id', value: string) => Promise<{ error: unknown | null }>
    }
    interface LeadsBuilder {
      insert: (values: Insert) => InsertBuilder
      update: (values: Update) => UpdateBuilder
    }
    return (this.supabase.from('leads') as unknown) as LeadsBuilder
  }

  // Narrow builder for 'opportunities' to type inserts
  private opportunitiesTable() {
    type Insert = Database['public']['Tables']['opportunities']['Insert']
    type InsertBuilder = {
      select: () => { single: () => Promise<{ data: Database['public']['Tables']['opportunities']['Row'] | null; error: unknown | null }> }
    }
    interface OpportunitiesBuilder {
      insert: (values: Insert) => InsertBuilder
    }
    return (this.supabase.from('opportunities') as unknown) as OpportunitiesBuilder
  }

  async getLeads(): Promise<ApiResponse<LeadWithScore[]>> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate scores for each lead
      const rows = (data ?? []) as unknown as Lead[]
      const leadsWithScores: LeadWithScore[] = rows.map((lead) => {
        const leadData: LeadData = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source
        }

        const scoreBreakdown = leadScoringEngine.calculateScore(leadData)

        return {
          ...lead,
          score_breakdown: scoreBreakdown
        }
      })

      return { data: leadsWithScores, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getLead(id: string): Promise<ApiResponse<LeadWithScore>> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate score for the lead
      const row = (data ?? null) as unknown as Lead | null
      if (!row) return { data: null, error: { message: 'Lead not found' } }

      const leadData: LeadData = {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        source: row.source
      }
      
      const scoreBreakdown = leadScoringEngine.calculateScore(leadData)
      
      const leadWithScore: LeadWithScore = {
        ...row,
        score_breakdown: scoreBreakdown
      }

      return { data: leadWithScore, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async createLead(lead: Omit<LeadInsert, 'organization_id' | 'created_by' | 'score'>): Promise<ApiResponse<Lead>> {
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

      // Calculate lead score
      const leadData: LeadData = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source
      }
      
      const scoreResult = leadScoringEngine.calculateScore(leadData)
      const score = scoreResult.totalScore

      const { data, error } = await this.leadsTable()
        .insert({
          ...lead,
          organization_id: (profile as Database['public']['Tables']['users']['Row']).organization_id,
          created_by: user.id,
          score
        })
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updateLead(id: string, updates: LeadUpdate): Promise<ApiResponse<Lead>> {
    try {
      // If updating lead data that affects scoring, recalculate score
      if (updates.first_name || updates.last_name || updates.email || updates.phone || updates.company || updates.source) {
        const { data: currentLead } = await this.supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        const current = (currentLead ?? null) as unknown as Lead | null
        if (current) {
          const leadData: LeadData = {
            first_name: updates.first_name || current.first_name,
            last_name: updates.last_name || current.last_name,
            email: updates.email || current.email,
            phone: updates.phone || current.phone,
            company: updates.company || current.company,
            source: updates.source || current.source
          }
          
          const scoreResult = leadScoringEngine.calculateScore(leadData)
          updates.score = scoreResult.totalScore
        }
      }

      const updateRes = await this.leadsTable()
        .update(updates as LeadUpdate)
        .eq('id', id)
      const updateErr = updateRes?.error as unknown | null
      if (updateErr) {
        return { data: null, error: normalizeError(updateErr) }
      }
      // Fetch updated row
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async deleteLead(id: string): Promise<{ error: ApiError | null }> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .delete()
        .eq('id', id)

      return { error: error ? normalizeError(error) : null }
    } catch (error) {
      return { error: normalizeError(error) }
    }
  }

  async searchLeads(query: string): Promise<ApiResponse<LeadWithScore[]>> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate scores for each lead
      const rows = (data ?? []) as unknown as Lead[]
      const leadsWithScores: LeadWithScore[] = rows.map((lead) => {
        const leadData: LeadData = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source
        }

        const scoreBreakdown = leadScoringEngine.calculateScore(leadData)

        return {
          ...lead,
          score_breakdown: scoreBreakdown
        }
      })

      return { data: leadsWithScores, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async convertLeadToOpportunity(leadId: string, opportunityData: {
    name: string
    deal_value?: number
    probability?: number
    contact_id?: string
    company_id?: string
  }): Promise<ApiResponse<{ lead: Lead; opportunity: Record<string, unknown> }>> {
    try {
      // Get the lead
      const { data: lead, error: leadError } = await this.supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError || !lead) {
        return { data: null, error: leadError ? normalizeError(leadError) : { message: 'Lead not found' } }
      }

      // Get current user and organization
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data: profile } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Create opportunity
      // Align with central opportunities schema (value, stage, close_date required)
      const oppInsert: Database['public']['Tables']['opportunities']['Insert'] = {
        name: opportunityData.name,
        value: opportunityData.deal_value ?? 0,
        stage: 'prospecting',
        probability: opportunityData.probability ?? 0,
        close_date: new Date().toISOString(),
        contact_id: opportunityData.contact_id ?? '',
        company_id: opportunityData.company_id ?? '',
        organization_id: (profile as Database['public']['Tables']['users']['Row']).organization_id,
        created_by: user.id,
      }
      const { data: opportunity, error: oppError } = await this.opportunitiesTable()
        .insert(oppInsert)
        .select()
        .single()

      if (oppError) {
        return { data: null, error: normalizeError(oppError) }
      }

      // Update lead status to converted
      const { error: updateError } = await this.leadsTable()
        .update({ status: 'converted' } as LeadUpdate)
        .eq('id', leadId)

      if (updateError) {
        // Handle lead status update error
      }

      return { data: { lead, opportunity }, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getLeadStats(): Promise<ApiResponse<LeadStats>> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('status, score')

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      const stats: LeadStats = {
        total: data?.length || 0,
        byStatus: {
          new: 0,
          contacted: 0,
          qualified: 0,
          converted: 0,
          closed: 0
        },
        byScore: {
          hot: 0,
          warm: 0,
          cool: 0,
          cold: 0
        }
      };

      (data as Array<{ status: string; score: number | null }> | null)?.forEach((lead) => {
        // Count by status
        const status = lead.status as keyof typeof stats.byStatus
        if (stats.byStatus[status] !== undefined) {
          stats.byStatus[status]++
        }

        // Count by score
        const score = lead.score ?? 0
        if (score >= 80) {
          stats.byScore.hot++
        } else if (score >= 60) {
          stats.byScore.warm++
        } else if (score >= 40) {
          stats.byScore.cool++
        } else {
          stats.byScore.cold++
        }
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async getLeadsByStatus(status: string): Promise<ApiResponse<LeadWithScore[]>> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: normalizeError(error) }
      }

      // Calculate scores for each lead
      const rows = (data ?? []) as unknown as Lead[]
      const leadsWithScores: LeadWithScore[] = rows.map((lead) => {
        const leadData: LeadData = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source
        }

        const scoreBreakdown = leadScoringEngine.calculateScore(leadData)

        return {
          ...lead,
          score_breakdown: scoreBreakdown
        }
      })

      return { data: leadsWithScores, error: null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }
}

export const leadAPI = new LeadAPI()