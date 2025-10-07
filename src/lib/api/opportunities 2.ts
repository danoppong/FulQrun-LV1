import { createClientComponentClient } from '@/lib/auth'
import { Database } from '@/lib/supabase'
import { ApiResponse, ApiError, normalizeError } from '@/lib/types/errors';

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
  implicate_pain?: string | null
  champion?: string | null
  competition?: string | null
}

export interface OpportunityFormData {
  name: string
  contact_id?: string | null
  company_id?: string | null
  description?: string | null
  assigned_to?: string | null
  peak_stage?: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
  meddpicc_score?: number
  deal_value?: number | null
  probability?: number | null
  close_date?: string | null
  metrics?: string | null
  economic_buyer?: string | null
  decision_criteria?: string | null
  decision_process?: string | null
  paper_process?: string | null
  identify_pain?: string | null
  implicate_pain?: string | null
  champion?: string | null
  competition?: string | null
}

export class OpportunityAPI {
  private get supabase() {
    return createClientComponentClient()
  }

  /**
   * Validate opportunity data before saving
   */
  private validateOpportunityData(data: Partial<OpportunityFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!data.name || data.name.trim() === '') {
      errors.push('Opportunity name is required')
    }

    // Validate probability range
    if (data.probability !== undefined && data.probability !== null) {
      if (data.probability < 0 || data.probability > 100) {
        errors.push('Probability must be between 0 and 100')
      }
    }

    // Validate deal value
    if (data.deal_value !== undefined && data.deal_value !== null) {
      if (data.deal_value < 0) {
        errors.push('Deal value cannot be negative')
      }
    }

    // Validate close date
    if (data.close_date && data.close_date !== '') {
      const closeDate = new Date(data.close_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(closeDate.getTime())) {
        errors.push('Invalid close date format')
      } else if (closeDate < today) {
        errors.push('Close date cannot be in the past')
      }
    }

    // Validate peak stage
    if (data.peak_stage && !['prospecting', 'engaging', 'advancing', 'key_decision'].includes(data.peak_stage)) {
      errors.push('Invalid peak stage')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
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

  async createOpportunity(opportunity: Omit<OpportunityFormData, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Opportunity>> {
    try {
      // Validate data
      const validation = this.validateOpportunityData(opportunity)
      if (!validation.isValid) {
        return { 
          data: null, 
          error: { 
            message: 'Validation failed', 
            details: validation.errors.join(', ') 
          } 
        }
      }

      // Get current user and organization
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Get user profile to get organization_id
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Prepare data for insertion
      const insertData: OpportunityInsert = {
        name: opportunity.name.trim(),
        contact_id: opportunity.contact_id || null,
        company_id: opportunity.company_id || null,
        description: opportunity.description || null,
        assigned_to: opportunity.assigned_to || null,
        peak_stage: opportunity.peak_stage || 'prospecting',
        deal_value: opportunity.deal_value || null,
        probability: opportunity.probability || null,
        close_date: opportunity.close_date || null,
        metrics: opportunity.metrics || null,
        economic_buyer: opportunity.economic_buyer || null,
        decision_criteria: opportunity.decision_criteria || null,
        decision_process: opportunity.decision_process || null,
        paper_process: opportunity.paper_process || null,
        identify_pain: opportunity.identify_pain || null,
        implicate_pain: opportunity.implicate_pain || null,
        champion: opportunity.champion || null,
        competition: opportunity.competition || null,
        organization_id: profile.organization_id,
        created_by: user.id
      }

      const { data, error } = await this.supabase
        .from('opportunities')
        .insert(insertData)
        .select()
        .single()

      return { data, error: error ? normalizeError(error) : null }
    } catch (error) {
      return { data: null, error: normalizeError(error) }
    }
  }

  async updateOpportunity(id: string, updates: Partial<OpportunityFormData>): Promise<ApiResponse<Opportunity>> {
    try {
      if (!id) {
        return { data: null, error: { message: 'Opportunity ID is required' } }
      }

      // Validate data
      const validation = this.validateOpportunityData(updates)
      if (!validation.isValid) {
        return { 
          data: null, 
          error: { 
            message: 'Validation failed', 
            details: validation.errors.join(', ') 
          } 
        }
      }

      // Prepare update data, only including fields that are provided
      const updateData: Partial<OpportunityUpdate> = {}
      
      if (updates.name !== undefined) updateData.name = updates.name.trim()
      if (updates.contact_id !== undefined) updateData.contact_id = updates.contact_id
      if (updates.company_id !== undefined) updateData.company_id = updates.company_id
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to
      if (updates.peak_stage !== undefined) updateData.peak_stage = updates.peak_stage
      if (updates.meddpicc_score !== undefined) updateData.meddpicc_score = updates.meddpicc_score
      if (updates.deal_value !== undefined) updateData.deal_value = updates.deal_value
      if (updates.probability !== undefined) updateData.probability = updates.probability
      if (updates.close_date !== undefined) updateData.close_date = updates.close_date
      if (updates.metrics !== undefined) updateData.metrics = updates.metrics
      if (updates.economic_buyer !== undefined) updateData.economic_buyer = updates.economic_buyer
      if (updates.decision_criteria !== undefined) updateData.decision_criteria = updates.decision_criteria
      if (updates.decision_process !== undefined) updateData.decision_process = updates.decision_process
      if (updates.paper_process !== undefined) updateData.paper_process = updates.paper_process
      if (updates.identify_pain !== undefined) updateData.identify_pain = updates.identify_pain
      if (updates.implicate_pain !== undefined) updateData.implicate_pain = updates.implicate_pain
      if (updates.champion !== undefined) updateData.champion = updates.champion
      if (updates.competition !== undefined) updateData.competition = updates.competition

      const { data, error } = await this.supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        return { data: null, error: normalizeError(error) }
      }

      console.log('Opportunity updated successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error updating opportunity:', error)
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
      if (!id) {
        return { data: null, error: { message: 'Opportunity ID is required' } }
      }

      if (!['prospecting', 'engaging', 'advancing', 'key_decision'].includes(stage)) {
        return { data: null, error: { message: 'Invalid peak stage' } }
      }

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

  /**
   * Update PEAK data specifically
   */
  async updatePEAKData(id: string, peakData: { peak_stage?: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'; deal_value?: number | null; probability?: number | null; close_date?: string | null }): Promise<ApiResponse<Opportunity>> {
    try {
      if (!id) {
        return { data: null, error: { message: 'Opportunity ID is required' } }
      }

      const validation = this.validateOpportunityData(peakData)
      if (!validation.isValid) {
        return { 
          data: null, 
          error: { 
            message: 'PEAK data validation failed', 
            details: validation.errors.join(', ') 
          } 
        }
      }

      const updateData: Partial<OpportunityUpdate> = {}
      if (peakData.peak_stage !== undefined) updateData.peak_stage = peakData.peak_stage
      if (peakData.deal_value !== undefined) updateData.deal_value = peakData.deal_value
      if (peakData.probability !== undefined) updateData.probability = peakData.probability
      if (peakData.close_date !== undefined) updateData.close_date = peakData.close_date

      const { data, error } = await this.supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating PEAK data:', error)
        return { data: null, error: normalizeError(error) }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error updating PEAK data:', error)
      return { data: null, error: normalizeError(error) }
    }
  }

  async updateMEDDPICC(id: string, meddpiccData: MEDDPICCData): Promise<ApiResponse<Opportunity>> {
    try {
      if (!id) {
        return { data: null, error: { message: 'Opportunity ID is required' } }
      }

      const updateData: Partial<OpportunityUpdate> = {}
      if (meddpiccData.metrics !== undefined) updateData.metrics = meddpiccData.metrics
      if (meddpiccData.economic_buyer !== undefined) updateData.economic_buyer = meddpiccData.economic_buyer
      if (meddpiccData.decision_criteria !== undefined) updateData.decision_criteria = meddpiccData.decision_criteria
      if (meddpiccData.decision_process !== undefined) updateData.decision_process = meddpiccData.decision_process
      if (meddpiccData.paper_process !== undefined) updateData.paper_process = meddpiccData.paper_process
      if (meddpiccData.identify_pain !== undefined) updateData.identify_pain = meddpiccData.identify_pain
      if (meddpiccData.implicate_pain !== undefined) updateData.implicate_pain = meddpiccData.implicate_pain
      if (meddpiccData.champion !== undefined) updateData.champion = meddpiccData.champion
      if (meddpiccData.competition !== undefined) updateData.competition = meddpiccData.competition

      const { data, error } = await this.supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating MEDDPICC data:', error)
        return { data: null, error: normalizeError(error) }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error updating MEDDPICC data:', error)
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

      data?.forEach((opp: Record<string, unknown>) => {
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