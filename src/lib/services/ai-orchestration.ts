import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert } from '@/lib/types/supabase'

export interface LeadGenerationRequest {
  lead_brief_id: string
  target_count?: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  enrichment_level?: 'BASIC' | 'ENHANCED' | 'PREMIUM'
}

export interface LeadGenerationResponse {
  job_id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  estimated_completion_time?: string
  generated_leads_count?: number
  errors?: string[]
}

export interface AIAccount {
  id: string
  legal_name: string
  known_as?: string
  domain?: string
  registry_ids?: Record<string, string>
  country?: string
  region?: 'US' | 'EU' | 'UK' | 'APAC'
  industry_code?: string
  revenue_band?: string
  employee_band?: string
  entity_type?: 'PUBLIC' | 'PRIVATE' | 'NONPROFIT' | 'OTHER'
  account_embedding?: number[]
  provenance: Record<string, any>
}

export interface AIContact {
  id: string
  account_id?: string
  full_name: string
  title?: string
  seniority?: 'C-LEVEL' | 'VP' | 'DIR' | 'IC'
  dept?: string
  linkedin_url?: string
  email_pattern_hint?: string
  email_status?: 'UNVERIFIED' | 'VERIFIED' | 'UNKNOWN'
  phone_hint?: string
  contact_embedding?: number[]
  provenance: Record<string, any>
}

export interface GeneratedLead {
  lead_type: 'account' | 'contact'
  account?: AIAccount
  contact?: AIContact
  geography: string
  industry?: string
  revenue_band?: string
  employee_band?: string
  entity_type?: string
  technographics?: string[]
  installed_tools_hints?: string[]
  intent_keywords?: string[]
  time_horizon?: 'NEAR_TERM' | 'MID_TERM' | 'LONG_TERM'
  icp_profile_id: string
  sources: string[]
  risk_flags?: string[]
  compliance?: Record<string, any>
  postprocessing?: Record<string, any>
}

export class AIOrchestrationService {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Generate leads based on a lead brief
   */
  async generateLeads(request: LeadGenerationRequest): Promise<LeadGenerationResponse> {
    try {
      // Get the lead brief
      const { data: leadBrief, error: briefError } = await this.supabase
        .from('lead_briefs')
        .select(`
          *,
          icp_profiles!inner(*)
        `)
        .eq('id', request.lead_brief_id)
        .single()

      if (briefError || !leadBrief) {
        throw new Error('Lead brief not found')
      }

      // Create a conversion job to track progress
      const { data: job, error: jobError } = await this.supabase
        .from('conversion_jobs')
        .insert({
          lead_id: '', // Will be updated when leads are created
          status: 'PENDING',
          idempotency_key: `lead_generation_${request.lead_brief_id}_${Date.now()}`,
          request_payload: request,
          organization_id: leadBrief.organization_id
        })
        .select()
        .single()

      if (jobError || !job) {
        throw new Error('Failed to create conversion job')
      }

      // Start the generation process asynchronously
      this.processLeadGeneration(job.id, leadBrief, request)

      return {
        job_id: job.id,
        status: 'PENDING',
        estimated_completion_time: this.calculateEstimatedCompletionTime(request.target_count || 100)
      }
    } catch (error) {
      console.error('Error generating leads:', error)
      return {
        job_id: '',
        status: 'FAILED',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Process lead generation asynchronously
   */
  private async processLeadGeneration(
    jobId: string,
    leadBrief: Tables<'lead_briefs'> & { icp_profiles: Tables<'icp_profiles'> },
    request: LeadGenerationRequest
  ) {
    try {
      // Update job status to IN_PROGRESS
      await this.supabase
        .from('conversion_jobs')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', jobId)

      const targetCount = request.target_count || 100
      const generatedLeads: GeneratedLead[] = []

      // Generate accounts if lead_type is 'account'
      if (leadBrief.lead_type === 'account') {
        const accounts = await this.generateAIAccounts(leadBrief, Math.ceil(targetCount * 0.7))
        generatedLeads.push(...accounts.map(account => ({
          lead_type: 'account' as const,
          account,
          geography: leadBrief.geography,
          industry: leadBrief.industry || undefined,
          revenue_band: leadBrief.revenue_band || undefined,
          employee_band: leadBrief.employee_band || undefined,
          entity_type: leadBrief.entity_type,
          technographics: leadBrief.technographics as string[] || [],
          installed_tools_hints: leadBrief.installed_tools_hints as string[] || [],
          intent_keywords: leadBrief.intent_keywords as string[] || [],
          time_horizon: leadBrief.time_horizon || undefined,
          icp_profile_id: leadBrief.icp_profile_id,
          sources: ['AI_GENERATED'],
          risk_flags: [],
          compliance: {},
          postprocessing: {}
        })))
      }

      // Generate contacts if lead_type is 'contact'
      if (leadBrief.lead_type === 'contact') {
        const contacts = await this.generateAIContacts(leadBrief, targetCount)
        generatedLeads.push(...contacts.map(contact => ({
          lead_type: 'contact' as const,
          contact,
          geography: leadBrief.geography,
          industry: leadBrief.industry || undefined,
          revenue_band: leadBrief.revenue_band || undefined,
          employee_band: leadBrief.employee_band || undefined,
          entity_type: leadBrief.entity_type,
          technographics: leadBrief.technographics as string[] || [],
          installed_tools_hints: leadBrief.installed_tools_hints as string[] || [],
          intent_keywords: leadBrief.intent_keywords as string[] || [],
          time_horizon: leadBrief.time_horizon || undefined,
          icp_profile_id: leadBrief.icp_profile_id,
          sources: ['AI_GENERATED'],
          risk_flags: [],
          compliance: {},
          postprocessing: {}
        })))
      }

      // Create leads in the database
      const createdLeads = await this.createLeadsFromGeneratedData(generatedLeads, leadBrief.organization_id)

      // Update job status to SUCCEEDED
      await this.supabase
        .from('conversion_jobs')
        .update({
          status: 'SUCCEEDED',
          response_payload: {
            generated_leads_count: createdLeads.length,
            leads: createdLeads.map(lead => lead.id)
          }
        })
        .eq('id', jobId)

    } catch (error) {
      console.error('Error processing lead generation:', error)
      
      // Update job status to FAILED
      await this.supabase
        .from('conversion_jobs')
        .update({
          status: 'FAILED',
          response_payload: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        .eq('id', jobId)
    }
  }

  /**
   * Generate AI accounts based on lead brief criteria
   */
  private async generateAIAccounts(
    leadBrief: Tables<'lead_briefs'>,
    count: number
  ): Promise<AIAccount[]> {
    // This is a placeholder implementation
    // In a real implementation, this would call an AI service or use data providers
    
    const accounts: AIAccount[] = []
    
    for (let i = 0; i < count; i++) {
      accounts.push({
        id: crypto.randomUUID(),
        legal_name: `Generated Company ${i + 1}`,
        known_as: `Company ${i + 1}`,
        domain: `company${i + 1}.com`,
        country: this.getRandomCountry(leadBrief.geography),
        region: leadBrief.geography,
        industry_code: leadBrief.industry || 'SOFTWARE',
        revenue_band: leadBrief.revenue_band || '$10–50M',
        employee_band: leadBrief.employee_band || '51–200',
        entity_type: leadBrief.entity_type,
        provenance: {
          source: 'AI_GENERATED',
          model: 'placeholder',
          confidence: 0.8,
          generated_at: new Date().toISOString()
        }
      })
    }
    
    return accounts
  }

  /**
   * Generate AI contacts based on lead brief criteria
   */
  private async generateAIContacts(
    leadBrief: Tables<'lead_briefs'>,
    count: number
  ): Promise<AIContact[]> {
    // This is a placeholder implementation
    // In a real implementation, this would call an AI service or use data providers
    
    const contacts: AIContact[] = []
    
    for (let i = 0; i < count; i++) {
      contacts.push({
        id: crypto.randomUUID(),
        full_name: `Generated Contact ${i + 1}`,
        title: this.getRandomTitle(),
        seniority: this.getRandomSeniority(),
        dept: this.getRandomDepartment(),
        email_pattern_hint: `contact${i + 1}@company.com`,
        email_status: 'UNKNOWN',
        provenance: {
          source: 'AI_GENERATED',
          model: 'placeholder',
          confidence: 0.8,
          generated_at: new Date().toISOString()
        }
      })
    }
    
    return contacts
  }

  /**
   * Create leads in the database from generated data
   */
  private async createLeadsFromGeneratedData(
    generatedLeads: GeneratedLead[],
    organizationId: string
  ): Promise<Tables<'leads'>[]> {
    const createdLeads: Tables<'leads'>[] = []

    for (const generatedLead of generatedLeads) {
      // Create AI account if it's an account lead
      let accountId: string | undefined
      if (generatedLead.account) {
        const { data: account, error: accountError } = await this.supabase
          .from('ai_accounts')
          .insert({
            ...generatedLead.account,
            organization_id: organizationId
          })
          .select()
          .single()

        if (accountError) {
          console.error('Error creating AI account:', accountError)
          continue
        }
        accountId = account.id
      }

      // Create AI contact if it's a contact lead
      let contactId: string | undefined
      if (generatedLead.contact) {
        const { data: contact, error: contactError } = await this.supabase
          .from('ai_contacts')
          .insert({
            ...generatedLead.contact,
            account_id: accountId,
            organization_id: organizationId
          })
          .select()
          .single()

        if (contactError) {
          console.error('Error creating AI contact:', contactError)
          continue
        }
        contactId = contact.id
      }

      // Create the lead
      const { data: lead, error: leadError } = await this.supabase
        .from('leads')
        .insert({
          lead_type: generatedLead.lead_type,
          account_id: accountId,
          contact_id: contactId,
          first_name: generatedLead.contact?.full_name?.split(' ')[0] || 'Generated',
          last_name: generatedLead.contact?.full_name?.split(' ').slice(1).join(' ') || 'Lead',
          company_name: generatedLead.account?.legal_name || generatedLead.account?.known_as || 'Generated Company',
          title: generatedLead.contact?.title,
          source: 'AI_GENERATED',
          status: 'GENERATED',
          geography: generatedLead.geography,
          industry: generatedLead.industry,
          revenue_band: generatedLead.revenue_band,
          employee_band: generatedLead.employee_band,
          entity_type: generatedLead.entity_type,
          technographics: generatedLead.technographics,
          installed_tools_hints: generatedLead.installed_tools_hints,
          intent_keywords: generatedLead.intent_keywords,
          time_horizon: generatedLead.time_horizon,
          icp_profile_id: generatedLead.icp_profile_id,
          sources: generatedLead.sources,
          risk_flags: generatedLead.risk_flags,
          compliance: generatedLead.compliance,
          postprocessing: generatedLead.postprocessing,
          organization_id: organizationId,
          created_by: (await this.supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single()

      if (leadError) {
        console.error('Error creating lead:', leadError)
        continue
      }

      createdLeads.push(lead)
    }

    return createdLeads
  }

  /**
   * Calculate estimated completion time based on target count
   */
  private calculateEstimatedCompletionTime(targetCount: number): string {
    const baseTime = 30 // 30 seconds base
    const perLeadTime = 0.5 // 0.5 seconds per lead
    const totalSeconds = baseTime + (targetCount * perLeadTime)
    
    const completionTime = new Date(Date.now() + totalSeconds * 1000)
    return completionTime.toISOString()
  }

  /**
   * Get random country based on geography
   */
  private getRandomCountry(geography: string): string {
    const countries = {
      'US': ['United States', 'Canada'],
      'EU': ['Germany', 'France', 'Netherlands', 'Sweden'],
      'UK': ['United Kingdom', 'Ireland'],
      'APAC': ['Australia', 'Singapore', 'Japan', 'India']
    }
    
    const geoCountries = countries[geography as keyof typeof countries] || countries['US']
    return geoCountries[Math.floor(Math.random() * geoCountries.length)]
  }

  /**
   * Get random job title
   */
  private getRandomTitle(): string {
    const titles = [
      'CEO', 'CTO', 'VP of Engineering', 'VP of Sales', 'VP of Marketing',
      'Director of Product', 'Director of Sales', 'Director of Marketing',
      'Senior Software Engineer', 'Product Manager', 'Sales Manager',
      'Marketing Manager', 'Business Development Manager'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  /**
   * Get random seniority level
   */
  private getRandomSeniority(): 'C-LEVEL' | 'VP' | 'DIR' | 'IC' {
    const seniorities: ('C-LEVEL' | 'VP' | 'DIR' | 'IC')[] = ['C-LEVEL', 'VP', 'DIR', 'IC']
    return seniorities[Math.floor(Math.random() * seniorities.length)]
  }

  /**
   * Get random department
   */
  private getRandomDepartment(): string {
    const departments = [
      'Engineering', 'Sales', 'Marketing', 'Product', 'Operations',
      'Finance', 'HR', 'Customer Success', 'Business Development'
    ]
    return departments[Math.floor(Math.random() * departments.length)]
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<Tables<'conversion_jobs'> | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversion_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('Error fetching job status:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching job status:', error)
      return null
    }
  }
}
