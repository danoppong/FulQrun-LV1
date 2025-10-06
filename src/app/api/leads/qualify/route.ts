import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const QualificationSchema = z.object({
  lead_ids: z.array(z.string().uuid()),
  framework: z.enum(['BANT', 'CHAMP', 'GPCTBA/C&I', 'SPICED', 'ANUM', 'FAINT', 'NEAT', 'PACT', 'JTBD_FIT', 'FIVE_FIT', 'ABM', 'TARGETING']),
  auto_qualify: z.boolean().optional().default(false)
})

const EvidenceSchema = z.object({
  lead_id: z.string().uuid(),
  framework: z.string(),
  field: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
  justification: z.string().optional()
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

    if (action === 'qualify') {
      return await qualifyLeads(supabase, body, userProfile.organization_id, user.id)
    } else if (action === 'add_evidence') {
      return await addEvidence(supabase, body, userProfile.organization_id, user.id)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "qualify" or "add_evidence"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in lead qualification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function qualifyLeads(
  supabase: any,
  body: any,
  organizationId: string,
  userId: string
) {
  const validationResult = QualificationSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_ids, framework, auto_qualify } = validationResult.data

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

  // Qualify each lead
  const qualificationResults = []
  for (const lead of leads) {
    const qualificationData = await performQualification(lead, framework, auto_qualify)
    
    // Insert or update qualification record
    const { data: qualification, error: qualError } = await supabase
      .from('lead_qualifications')
      .upsert({
        lead_id: lead.id,
        framework,
        status: qualificationData.status,
        data: qualificationData.data,
        organization_id: organizationId
      })
      .select()
      .single()

    if (qualError) {
      console.error('Error creating qualification:', qualError)
      continue
    }

    // Add evidence records
    if (qualificationData.evidence && qualificationData.evidence.length > 0) {
      const evidenceToInsert = qualificationData.evidence.map(evidence => ({
        ...evidence,
        organization_id: organizationId,
        actor_user_id: userId
      }))

      const { error: evidenceError } = await supabase
        .from('framework_evidence')
        .insert(evidenceToInsert)

      if (evidenceError) {
        console.error('Error inserting evidence:', evidenceError)
      }
    }

    // Update lead status if qualified
    if (qualificationData.status === 'QUALIFIED') {
      await supabase
        .from('leads')
        .update({
          status: 'qualified',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)
    }

    qualificationResults.push({
      lead_id: lead.id,
      qualification,
      evidence: qualificationData.evidence || []
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      qualifications: qualificationResults,
      count: qualificationResults.length,
      framework
    }
  })
}

async function addEvidence(
  supabase: any,
  body: any,
  organizationId: string,
  userId: string
) {
  const validationResult = EvidenceSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_id, framework, field, value, confidence, source, justification } = validationResult.data

  // Verify user has access to the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .eq('organization_id', organizationId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json(
      { error: 'Lead not found or access denied' },
      { status: 404 }
    )
  }

  // Insert evidence record
  const { data: evidence, error: evidenceError } = await supabase
    .from('framework_evidence')
    .insert({
      lead_id,
      framework,
      field,
      value,
      confidence: confidence || 0.8,
      source: source || 'USER',
      actor_user_id: userId,
      justification,
      organization_id: organizationId
    })
    .select()
    .single()

  if (evidenceError) {
    console.error('Error inserting evidence:', evidenceError)
    return NextResponse.json(
      { error: 'Failed to add evidence' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: evidence
  })
}

async function performQualification(
  lead: any,
  framework: string,
  autoQualify: boolean
): Promise<any> {
  // This is a placeholder implementation
  // In a real implementation, this would use the specific framework logic
  
  const qualificationData: any = {
    status: 'NOT_STARTED',
    data: {},
    evidence: []
  }

  // Framework-specific qualification logic
  switch (framework) {
    case 'BANT':
      qualificationData.data = await qualifyBANT(lead)
      break
    case 'CHAMP':
      qualificationData.data = await qualifyCHAMP(lead)
      break
    case 'GPCTBA/C&I':
      qualificationData.data = await qualifyGPCTBA(lead)
      break
    case 'SPICED':
      qualificationData.data = await qualifySPICED(lead)
      break
    case 'ANUM':
      qualificationData.data = await qualifyANUM(lead)
      break
    case 'FAINT':
      qualificationData.data = await qualifyFAINT(lead)
      break
    case 'NEAT':
      qualificationData.data = await qualifyNEAT(lead)
      break
    case 'PACT':
      qualificationData.data = await qualifyPACT(lead)
      break
    case 'JTBD_FIT':
      qualificationData.data = await qualifyJTBD(lead)
      break
    case 'FIVE_FIT':
      qualificationData.data = await qualifyFIVEFIT(lead)
      break
    case 'ABM':
      qualificationData.data = await qualifyABM(lead)
      break
    case 'TARGETING':
      qualificationData.data = await qualifyTARGETING(lead)
      break
  }

  // Determine qualification status
  const qualifiedCount = Object.values(qualificationData.data).filter((value: any) => 
    value === true || (typeof value === 'object' && value.qualified === true)
  ).length

  const totalCriteria = Object.keys(qualificationData.data).length
  const qualificationThreshold = autoQualify ? 0.6 : 0.8

  if (qualifiedCount / totalCriteria >= qualificationThreshold) {
    qualificationData.status = 'QUALIFIED'
  } else if (qualifiedCount / totalCriteria >= 0.3) {
    qualificationData.status = 'IN_PROGRESS'
  } else {
    qualificationData.status = 'DISQUALIFIED'
  }

  // Generate evidence records
  qualificationData.evidence = generateEvidenceRecords(lead, framework, qualificationData.data)

  return qualificationData
}

async function qualifyBANT(lead: any): Promise<any> {
  return {
    budget: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.8
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.7
    },
    need: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.6
    },
    timeline: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.5
    }
  }
}

async function qualifyCHAMP(lead: any): Promise<any> {
  return {
    challenges: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    },
    money: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    },
    prioritization: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.6
    }
  }
}

async function qualifyGPCTBA(lead: any): Promise<any> {
  return {
    goals: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.6
    },
    plans: {
      qualified: lead.technographics && lead.technographics.length > 0,
      value: lead.technographics,
      confidence: 0.7
    },
    challenges: {
      qualified: lead.risk_flags && lead.risk_flags.length === 0,
      value: lead.risk_flags,
      confidence: 0.8
    },
    timeline: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.5
    },
    budget: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    }
  }
}

async function qualifySPICED(lead: any): Promise<any> {
  return {
    situation: {
      qualified: lead.industry && lead.industry !== '',
      value: lead.industry,
      confidence: 0.8
    },
    problem: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    implication: {
      qualified: lead.risk_flags && lead.risk_flags.length > 0,
      value: lead.risk_flags,
      confidence: 0.6
    },
    consequence: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.5
    },
    evidence: {
      qualified: lead.ai_contacts?.[0]?.email_status === 'VERIFIED',
      value: lead.ai_contacts?.[0]?.email_status,
      confidence: 0.9
    },
    decision: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    }
  }
}

async function qualifyANUM(lead: any): Promise<any> {
  return {
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    },
    need: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    urgency: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.6
    },
    money: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    }
  }
}

async function qualifyFAINT(lead: any): Promise<any> {
  return {
    funds: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    },
    interest: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    need: {
      qualified: lead.technographics && lead.technographics.length > 0,
      value: lead.technographics,
      confidence: 0.6
    },
    timeline: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.5
    }
  }
}

async function qualifyNEAT(lead: any): Promise<any> {
  return {
    need: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    economic_impact: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.8
    },
    access_to_authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    },
    timeline: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.6
    }
  }
}

async function qualifyPACT(lead: any): Promise<any> {
  return {
    pain: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    },
    competition: {
      qualified: lead.technographics && lead.technographics.length > 0,
      value: lead.technographics,
      confidence: 0.6
    },
    timescale: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.5
    }
  }
}

async function qualifyJTBD(lead: any): Promise<any> {
  return {
    job_to_be_done: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    fit: {
      qualified: lead.icp_profile_id !== null,
      value: lead.icp_profile_id,
      confidence: 0.8
    }
  }
}

async function qualifyFIVEFIT(lead: any): Promise<any> {
  return {
    fit: {
      qualified: lead.icp_profile_id !== null,
      value: lead.icp_profile_id,
      confidence: 0.8
    },
    interest: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.7
    },
    timing: {
      qualified: lead.time_horizon && lead.time_horizon !== 'LONG_TERM',
      value: lead.time_horizon,
      confidence: 0.6
    },
    budget: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    },
    authority: {
      qualified: lead.ai_contacts?.[0]?.seniority && ['C-LEVEL', 'VP', 'DIR'].includes(lead.ai_contacts[0].seniority),
      value: lead.ai_contacts?.[0]?.seniority,
      confidence: 0.8
    }
  }
}

async function qualifyABM(lead: any): Promise<any> {
  return {
    account_fit: {
      qualified: lead.icp_profile_id !== null,
      value: lead.icp_profile_id,
      confidence: 0.8
    },
    buying_committee: {
      qualified: lead.ai_contacts && lead.ai_contacts.length > 0,
      value: lead.ai_contacts.length,
      confidence: 0.7
    },
    engagement: {
      qualified: lead.ai_contacts?.[0]?.email_status === 'VERIFIED',
      value: lead.ai_contacts?.[0]?.email_status,
      confidence: 0.9
    }
  }
}

async function qualifyTARGETING(lead: any): Promise<any> {
  return {
    demographic_fit: {
      qualified: lead.industry && lead.industry !== '',
      value: lead.industry,
      confidence: 0.8
    },
    firmographic_fit: {
      qualified: lead.revenue_band && lead.revenue_band !== '<$10M',
      value: lead.revenue_band,
      confidence: 0.9
    },
    technographic_fit: {
      qualified: lead.technographics && lead.technographics.length > 0,
      value: lead.technographics,
      confidence: 0.7
    },
    behavioral_fit: {
      qualified: lead.intent_keywords && lead.intent_keywords.length > 0,
      value: lead.intent_keywords,
      confidence: 0.6
    }
  }
}

function generateEvidenceRecords(lead: any, framework: string, qualificationData: any): any[] {
  const evidence: any[] = []

  for (const [field, data] of Object.entries(qualificationData)) {
    if (typeof data === 'object' && data !== null) {
      evidence.push({
        lead_id: lead.id,
        framework,
        field,
        value: data,
        confidence: (data as any).confidence || 0.8,
        source: 'AI_QUALIFICATION'
      })
    }
  }

  return evidence
}
