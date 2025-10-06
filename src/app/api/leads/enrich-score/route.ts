import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const EnrichmentSchema = z.object({
  lead_ids: z.array(z.string().uuid()),
  enrichment_level: z.enum(['BASIC', 'ENHANCED', 'PREMIUM']).optional().default('BASIC'),
  providers: z.array(z.enum(['CLEARBIT', 'ZOOMINFO', 'OPPORTUNITY', 'COMPLIANCE'])).optional()
})

const ScoringSchema = z.object({
  lead_ids: z.array(z.string().uuid()),
  weights: z.object({
    fit: z.number().min(0).max(1).optional().default(0.3),
    intent: z.number().min(0).max(1).optional().default(0.25),
    engagement: z.number().min(0).max(1).optional().default(0.2),
    viability: z.number().min(0).max(1).optional().default(0.15),
    recency: z.number().min(0).max(1).optional().default(0.1)
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'enrich') {
      return await enrichLeads(supabase, body, userProfile.organization_id)
    } else if (action === 'score') {
      return await scoreLeads(supabase, body, userProfile.organization_id)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "enrich" or "score"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in lead enrichment/scoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function enrichLeads(
  supabase: any,
  body: any,
  organizationId: string
) {
  const validationResult = EnrichmentSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_ids, enrichment_level, providers } = validationResult.data

  // Verify user has access to the leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select(`
      *,
      ai_accounts(*),
      ai_contacts(*)
    `)
    .in('id', lead_ids)
    .eq('organization_id', organizationId)

  if (leadsError || !leads) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }

  if (leads.length !== lead_ids.length) {
    return NextResponse.json(
      { error: 'Some leads not found or access denied' },
      { status: 404 }
    )
  }

  // Enrich each lead
  const enrichmentResults = []
  for (const lead of leads) {
    const enrichedData = await enrichLeadData(lead, enrichment_level, providers)
    
    // Update lead with enriched data
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'ENRICHED',
        industry: enrichedData.industry || lead.industry,
        revenue_band: enrichedData.revenue_band || lead.revenue_band,
        employee_band: enrichedData.employee_band || lead.employee_band,
        technographics: enrichedData.technographics || lead.technographics,
        installed_tools_hints: enrichedData.installed_tools_hints || lead.installed_tools_hints,
        intent_keywords: enrichedData.intent_keywords || lead.intent_keywords,
        sources: [...(lead.sources || []), ...enrichedData.sources],
        risk_flags: enrichedData.risk_flags || lead.risk_flags,
        compliance: enrichedData.compliance || lead.compliance,
        postprocessing: {
          ...lead.postprocessing,
          enrichment: {
            level: enrichment_level,
            providers: providers || [],
            enriched_at: new Date().toISOString(),
            data: enrichedData
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      continue
    }

    enrichmentResults.push(updatedLead)
  }

  return NextResponse.json({
    success: true,
    data: {
      enriched_leads: enrichmentResults,
      count: enrichmentResults.length,
      enrichment_level
    }
  })
}

async function scoreLeads(
  supabase: any,
  body: any,
  organizationId: string
) {
  const validationResult = ScoringSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_ids, weights } = validationResult.data

  // Verify user has access to the leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select(`
      *,
      ai_accounts(*),
      ai_contacts(*),
      icp_profiles(*)
    `)
    .in('id', lead_ids)
    .eq('organization_id', organizationId)

  if (leadsError || !leads) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }

  if (leads.length !== lead_ids.length) {
    return NextResponse.json(
      { error: 'Some leads not found or access denied' },
      { status: 404 }
    )
  }

  // Score each lead
  const scoringResults = []
  for (const lead of leads) {
    const scores = await calculateLeadScores(lead, weights)
    
    // Insert enhanced lead scores
    const { data: scoreRecord, error: scoreError } = await supabase
      .from('enhanced_lead_scores')
      .insert({
        lead_id: lead.id,
        fit: scores.fit,
        intent: scores.intent,
        engagement: scores.engagement,
        viability: scores.viability,
        recency: scores.recency,
        composite: scores.composite,
        weights: weights || {
          fit: 0.3,
          intent: 0.25,
          engagement: 0.2,
          viability: 0.15,
          recency: 0.1
        },
        segment: scores.segment,
        organization_id: organizationId
      })
      .select()
      .single()

    if (scoreError) {
      console.error('Error creating score record:', scoreError)
      continue
    }

    // Update lead with composite score
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        score: Math.round(scores.composite),
        status: 'QUALIFIED',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead score:', updateError)
      continue
    }

    scoringResults.push({
      lead: updatedLead,
      scores: scoreRecord
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      scored_leads: scoringResults,
      count: scoringResults.length,
      weights: weights || {
        fit: 0.3,
        intent: 0.25,
        engagement: 0.2,
        viability: 0.15,
        recency: 0.1
      }
    }
  })
}

async function enrichLeadData(
  lead: any,
  enrichmentLevel: string,
  providers?: string[]
): Promise<any> {
  // This is a placeholder implementation
  // In a real implementation, this would call external data providers
  
  const enrichedData: any = {
    sources: [`ENRICHED_${enrichmentLevel}`],
    risk_flags: [],
    compliance: {}
  }

  // Simulate enrichment based on level
  if (enrichmentLevel === 'BASIC') {
    enrichedData.industry = lead.industry || 'Software'
    enrichedData.revenue_band = lead.revenue_band || '$10–50M'
    enrichedData.employee_band = lead.employee_band || '51–200'
  } else if (enrichmentLevel === 'ENHANCED') {
    enrichedData.industry = lead.industry || 'Software'
    enrichedData.revenue_band = lead.revenue_band || '$10–50M'
    enrichedData.employee_band = lead.employee_band || '51–200'
    enrichedData.technographics = ['CRM', 'Marketing Automation', 'Analytics']
    enrichedData.installed_tools_hints = ['Salesforce', 'HubSpot', 'Google Analytics']
    enrichedData.intent_keywords = ['software', 'automation', 'efficiency']
  } else if (enrichmentLevel === 'PREMIUM') {
    enrichedData.industry = lead.industry || 'Software'
    enrichedData.revenue_band = lead.revenue_band || '$10–50M'
    enrichedData.employee_band = lead.employee_band || '51–200'
    enrichedData.technographics = ['CRM', 'Marketing Automation', 'Analytics', 'ERP', 'BI']
    enrichedData.installed_tools_hints = ['Salesforce', 'HubSpot', 'Google Analytics', 'Tableau', 'SAP']
    enrichedData.intent_keywords = ['software', 'automation', 'efficiency', 'scalability', 'integration']
    enrichedData.compliance = {
      gdpr_compliant: true,
      soc2_compliant: true,
      iso27001_compliant: false
    }
  }

  return enrichedData
}

async function calculateLeadScores(
  lead: any,
  weights?: any
): Promise<any> {
  // This is a placeholder implementation
  // In a real implementation, this would use ML models and data analysis
  
  const defaultWeights = {
    fit: 0.3,
    intent: 0.25,
    engagement: 0.2,
    viability: 0.15,
    recency: 0.1
  }

  const finalWeights = weights || defaultWeights

  // Calculate individual scores (0-100 scale)
  const fit = calculateFitScore(lead)
  const intent = calculateIntentScore(lead)
  const engagement = calculateEngagementScore(lead)
  const viability = calculateViabilityScore(lead)
  const recency = calculateRecencyScore(lead)

  // Calculate composite score
  const composite = (
    fit * finalWeights.fit +
    intent * finalWeights.intent +
    engagement * finalWeights.engagement +
    viability * finalWeights.viability +
    recency * finalWeights.recency
  ) * 100

  // Determine segment
  let segment = 'COLD'
  if (composite >= 80) segment = 'HOT'
  else if (composite >= 60) segment = 'WARM'
  else if (composite >= 40) segment = 'LUKEWARM'

  return {
    fit,
    intent,
    engagement,
    viability,
    recency,
    composite,
    segment
  }
}

function calculateFitScore(lead: any): number {
  // Placeholder logic for fit score
  let score = 0.5 // Base score

  // Industry match
  if (lead.industry) score += 0.1

  // Revenue band match
  if (lead.revenue_band) score += 0.1

  // Employee band match
  if (lead.employee_band) score += 0.1

  // ICP profile match
  if (lead.icp_profile_id) score += 0.2

  return Math.min(score, 1)
}

function calculateIntentScore(lead: any): number {
  // Placeholder logic for intent score
  let score = 0.3 // Base score

  // Intent keywords
  if (lead.intent_keywords && lead.intent_keywords.length > 0) {
    score += Math.min(lead.intent_keywords.length * 0.1, 0.4)
  }

  // Technographics
  if (lead.technographics && lead.technographics.length > 0) {
    score += Math.min(lead.technographics.length * 0.05, 0.3)
  }

  return Math.min(score, 1)
}

function calculateEngagementScore(lead: any): number {
  // Placeholder logic for engagement score
  let score = 0.2 // Base score

  // Email status
  if (lead.ai_contacts?.[0]?.email_status === 'VERIFIED') {
    score += 0.3
  }

  // LinkedIn presence
  if (lead.ai_contacts?.[0]?.linkedin_url) {
    score += 0.2
  }

  // Contact completeness
  if (lead.ai_contacts?.[0]?.title && lead.ai_contacts?.[0]?.dept) {
    score += 0.3
  }

  return Math.min(score, 1)
}

function calculateViabilityScore(lead: any): number {
  // Placeholder logic for viability score
  let score = 0.4 // Base score

  // Risk flags
  if (lead.risk_flags && lead.risk_flags.length === 0) {
    score += 0.2
  }

  // Compliance
  if (lead.compliance && Object.keys(lead.compliance).length > 0) {
    score += 0.2
  }

  // Entity type
  if (lead.entity_type === 'PUBLIC') {
    score += 0.2
  }

  return Math.min(score, 1)
}

function calculateRecencyScore(lead: any): number {
  // Placeholder logic for recency score
  const createdAt = new Date(lead.created_at)
  const now = new Date()
  const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff <= 1) return 1
  if (daysDiff <= 7) return 0.8
  if (daysDiff <= 30) return 0.6
  if (daysDiff <= 90) return 0.4
  return 0.2
}
