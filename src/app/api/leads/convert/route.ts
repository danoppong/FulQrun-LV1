import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers'
import { z } from 'zod';

const ConversionSchema = z.object({
  lead_ids: z.array(z.string().uuid()),
  opportunity_data: z.object({
    name: z.string().optional(),
    stage: z.enum(['prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional().default('prospecting'),
    value: z.number().optional(),
    probability: z.number().min(0).max(100).optional().default(0),
    close_date: z.string().optional(),
    description: z.string().optional(),
    meddpicc_data: z.any().optional() // Integration with existing MEDDPICC module
  }).optional(),
  idempotency_key: z.string().optional()
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
    const validationResult = ConversionSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { lead_ids, opportunity_data, idempotency_key } = validationResult.data

    // Verify user has access to the leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        ai_accounts(*),
        ai_contacts(*),
        companies(*)
      `)
      .in('id', lead_ids)
      .eq('organization_id', userProfile.organization_id)
      .eq('status', 'qualified') // Only convert qualified leads

    if (leadsError || !leads) {
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    if (leads.length !== lead_ids.length) {
      return NextResponse.json(
        { error: 'Some leads not found, not qualified, or access denied' },
        { status: 404 }
      )
    }

    // Convert each lead to opportunity
    const conversionResults = []
    for (const lead of leads) {
      const result = await convertLeadToOpportunity(
        supabase,
        lead,
        opportunity_data,
        userProfile.organization_id,
        user.id,
        idempotency_key
      )
      
      if (result.success) {
        conversionResults.push(result.data)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conversions: conversionResults,
        count: conversionResults.length
      }
    })

  } catch (error) {
    console.error('Error in lead conversion API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function convertLeadToOpportunity(
  supabase: any,
  lead: any,
  opportunityData: any,
  organizationId: string,
  userId: string,
  idempotencyKey?: string
): Promise<any> {
  try {
    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `conversion_${lead.id}_${Date.now()}`

    // Check if conversion already exists
    const { data: existingJob } = await supabase
      .from('conversion_jobs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('idempotency_key', finalIdempotencyKey)
      .single()

    if (existingJob && existingJob.status === 'SUCCEEDED') {
      return {
        success: true,
        data: {
          lead_id: lead.id,
          opportunity_id: existingJob.response_payload?.opportunity_id,
          status: 'ALREADY_CONVERTED',
          job_id: existingJob.id
        }
      }
    }

    // Create conversion job
    const { data: job, error: jobError } = await supabase
      .from('conversion_jobs')
      .insert({
        lead_id: lead.id,
        status: 'PENDING',
        idempotency_key: finalIdempotencyKey,
        request_payload: {
          lead_id: lead.id,
          opportunity_data: opportunityData
        },
        organization_id: organizationId
      })
      .select()
      .single()

    if (jobError || !job) {
      throw new Error('Failed to create conversion job')
    }

    // Update job status to IN_PROGRESS
    await supabase
      .from('conversion_jobs')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', job.id)

    // Find or create company
    let companyId: string | undefined
    if (lead.ai_accounts && lead.ai_accounts.length > 0) {
      const account = lead.ai_accounts[0]
      
      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('domain', account.domain)
        .eq('organization_id', organizationId)
        .single()

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        // Create new company from AI account
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: account.legal_name || account.known_as,
            domain: account.domain,
            industry: account.industry_code,
            size: account.employee_band,
            annual_revenue: parseRevenueBand(account.revenue_band),
            employee_count: parseEmployeeBand(account.employee_band),
            website: account.domain ? `https://${account.domain}` : undefined,
            address: account.country,
            country: account.country,
            organization_id: organizationId,
            created_by: userId
          })
          .select()
          .single()

        if (companyError) {
          console.error('Error creating company:', companyError)
        } else {
          companyId = newCompany.id
        }
      }
    } else if (lead.companies && lead.companies.length > 0) {
      companyId = lead.companies[0].id
    }

    // Find or create contact
    let contactId: string | undefined
    if (lead.ai_contacts && lead.ai_contacts.length > 0) {
      const aiContact = lead.ai_contacts[0]
      
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', aiContact.email_pattern_hint)
        .eq('organization_id', organizationId)
        .single()

      if (existingContact) {
        contactId = existingContact.id
      } else {
        // Create new contact from AI contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: aiContact.full_name.split(' ')[0],
            last_name: aiContact.full_name.split(' ').slice(1).join(' ') || '',
            email: aiContact.email_pattern_hint,
            title: aiContact.title,
            department: aiContact.dept,
            company_id: companyId,
            organization_id: organizationId,
            created_by: userId
          })
          .select()
          .single()

        if (contactError) {
          console.error('Error creating contact:', contactError)
        } else {
          contactId = newContact.id
        }
      }
    }

    // Create opportunity
    const opportunityName = opportunityData?.name || 
      `${lead.company_name || 'Generated Company'} - ${lead.ai_contacts?.[0]?.title || 'Opportunity'}`

    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .insert({
        name: opportunityName,
        company_id: companyId,
        contact_id: contactId,
        stage: opportunityData?.stage || 'prospecting',
        value: opportunityData?.value || null,
        probability: opportunityData?.probability || 0,
        close_date: opportunityData?.close_date || null,
        description: opportunityData?.description || `Converted from lead: ${lead.first_name} ${lead.last_name}`,
        organization_id: organizationId,
        assigned_to: userId,
        created_by: userId
      })
      .select()
      .single()

    if (opportunityError) {
      throw new Error(`Failed to create opportunity: ${opportunityError.message}`)
    }

    // Create opportunity reference
    const { error: refError } = await supabase
      .from('opportunity_references')
      .insert({
        lead_id: lead.id,
        external_opportunity_id: opportunity.id,
        external_account_id: companyId,
        external_contact_id: contactId,
        mapping: {
          lead_id: lead.id,
          opportunity_id: opportunity.id,
          company_id: companyId,
          contact_id: contactId,
          conversion_data: opportunityData
        },
        organization_id: organizationId
      })

    if (refError) {
      console.error('Error creating opportunity reference:', refError)
    }

    // Update lead status to converted
    await supabase
      .from('leads')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)

    // Update job status to SUCCEEDED
    await supabase
      .from('conversion_jobs')
      .update({
        status: 'SUCCEEDED',
        response_payload: {
          opportunity_id: opportunity.id,
          company_id: companyId,
          contact_id: contactId,
          conversion_data: opportunityData
        }
      })
      .eq('id', job.id)

    return {
      success: true,
      data: {
        lead_id: lead.id,
        opportunity_id: opportunity.id,
        company_id: companyId,
        contact_id: contactId,
        status: 'CONVERTED',
        job_id: job.id
      }
    }

  } catch (error) {
    console.error('Error converting lead:', error)
    
    // Update job status to FAILED
    await supabase
      .from('conversion_jobs')
      .update({
        status: 'FAILED',
        response_payload: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', job?.id)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function parseRevenueBand(revenueBand: string): number | null {
  if (!revenueBand) return null
  
  const revenueMap: Record<string, number> = {
    '<$10M': 5000000,
    '$10–50M': 30000000,
    '$50–250M': 150000000,
    '$250M–$1B': 625000000,
    '>$1B': 2000000000
  }
  
  return revenueMap[revenueBand] || null
}

function parseEmployeeBand(employeeBand: string): number | null {
  if (!employeeBand) return null
  
  const employeeMap: Record<string, number> = {
    '1–50': 25,
    '51–200': 125,
    '201–1k': 600,
    '1k–5k': 3000,
    '>5k': 10000
  }
  
  return employeeMap[employeeBand] || null
}
