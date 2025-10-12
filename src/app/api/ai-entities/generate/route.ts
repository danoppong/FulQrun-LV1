import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod';

const AccountGenerationSchema = z.object({
  lead_brief_id: z.string().uuid(),
  count: z.number().min(1).max(500).optional().default(100),
  enrichment_level: z.enum(['BASIC', 'ENHANCED', 'PREMIUM']).optional().default('BASIC')
})

const ContactGenerationSchema = z.object({
  lead_brief_id: z.string().uuid(),
  account_ids: z.array(z.string().uuid()).optional(),
  count: z.number().min(1).max(500).optional().default(100),
  enrichment_level: z.enum(['BASIC', 'ENHANCED', 'PREMIUM']).optional().default('BASIC')
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
    const { type } = body

    if (type === 'accounts') {
      return await generateAccounts(supabase, body, userProfile.organization_id)
    } else if (type === 'contacts') {
      return await generateContacts(supabase, body, userProfile.organization_id)
    } else {
      return NextResponse.json(
        { error: 'Invalid generation type. Must be "accounts" or "contacts"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in AI entity generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'

async function generateAccounts(
  supabase: SupabaseClient,
  body: unknown,
  organizationId: string
) {
  const validationResult = AccountGenerationSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_brief_id, count, enrichment_level } = validationResult.data

  // Verify user has access to the lead brief
  const { data: leadBrief, error: briefError } = await supabase
    .from('lead_briefs')
    .select(`
      *,
      icp_profiles!inner(*)
    `)
    .eq('id', lead_brief_id)
    .eq('organization_id', organizationId)
    .single()

  if (briefError || !leadBrief) {
    return NextResponse.json(
      { error: 'Lead brief not found or access denied' },
      { status: 404 }
    )
  }

  // Generate AI accounts
  const generatedAccounts = await generateAIAccounts(leadBrief, count, enrichment_level)

  // Insert accounts into database
  const accountsToInsert = generatedAccounts.map(account => ({
    ...account,
    organization_id: organizationId
  }))

  const { data: insertedAccounts, error: insertError } = await supabase
    .from('ai_accounts')
    .insert(accountsToInsert)
    .select()

  if (insertError) {
    console.error('Error inserting AI accounts:', insertError)
    return NextResponse.json(
      { error: 'Failed to save generated accounts' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      accounts: insertedAccounts,
      count: insertedAccounts.length,
      enrichment_level
    }
  })
}

async function generateContacts(
  supabase: SupabaseClient,
  body: unknown,
  organizationId: string
) {
  const validationResult = ContactGenerationSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { lead_brief_id, account_ids, count, enrichment_level } = validationResult.data

  // Verify user has access to the lead brief
  const { data: leadBrief, error: briefError } = await supabase
    .from('lead_briefs')
    .select(`
      *,
      icp_profiles!inner(*)
    `)
    .eq('id', lead_brief_id)
    .eq('organization_id', organizationId)
    .single()

  if (briefError || !leadBrief) {
    return NextResponse.json(
      { error: 'Lead brief not found or access denied' },
      { status: 404 }
    )
  }

  // Get accounts if account_ids provided
  let accounts: GeneratedAccount[] = []
  if (account_ids && account_ids.length > 0) {
    const { data: accountData, error: accountError } = await supabase
      .from('ai_accounts')
      .select('*')
      .in('id', account_ids)
      .eq('organization_id', organizationId)

    if (accountError) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }
  accounts = (accountData as GeneratedAccount[]) || []
  }

  // Generate AI contacts
  const generatedContacts = await generateAIContacts(leadBrief, count, enrichment_level, accounts)

  // Insert contacts into database
  const contactsToInsert = generatedContacts.map(contact => ({
    ...contact,
    organization_id: organizationId
  }))

  const { data: insertedContacts, error: insertError } = await supabase
    .from('ai_contacts')
    .insert(contactsToInsert)
    .select()

  if (insertError) {
    console.error('Error inserting AI contacts:', insertError)
    return NextResponse.json(
      { error: 'Failed to save generated contacts' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      contacts: insertedContacts,
      count: insertedContacts.length,
      enrichment_level
    }
  })
}

interface LeadBriefInput {
  id?: string
  geography?: string
  industry?: string
  revenue_band?: string
  employee_band?: string
  entity_type?: string
}

interface GeneratedAccount {
  id: string
  legal_name: string
  known_as: string
  domain: string
  country?: string
  region?: string
  industry_code: string
  revenue_band?: string
  employee_band?: string
  entity_type?: string
  provenance: {
    source: string
    model: string
    confidence: number
    enrichment_level: string
    generated_at: string
    lead_brief_id?: string
  }
}

interface GeneratedContact {
  id: string
  account_id?: string
  full_name: string
  title: string
  seniority: 'C-LEVEL' | 'VP' | 'DIR' | 'IC'
  dept: string
  email_pattern_hint: string
  email_status: 'UNKNOWN' | 'VERIFIED' | 'BOUNCED'
  provenance: GeneratedAccount['provenance']
}

async function generateAIAccounts(
  leadBrief: LeadBriefInput,
  count: number,
  _enrichmentLevel: string
): Promise<GeneratedAccount[]> {
  // This is a placeholder implementation
  // In a real implementation, this would call an AI service or use data providers
  
  const accounts: GeneratedAccount[] = []
  
  for (let i = 0; i < count; i++) {
    accounts.push({
      id: crypto.randomUUID(),
      legal_name: `Generated Company ${i + 1}`,
      known_as: `Company ${i + 1}`,
      domain: `company${i + 1}.com`,
      country: getRandomCountry(leadBrief.geography || 'US'),
      region: leadBrief.geography,
      industry_code: leadBrief.industry || 'SOFTWARE',
      revenue_band: leadBrief.revenue_band || '$10–50M',
      employee_band: leadBrief.employee_band || '51–200',
      entity_type: leadBrief.entity_type,
      provenance: {
        source: 'AI_GENERATED',
        model: 'placeholder',
        confidence: 0.8,
        enrichment_level,
        generated_at: new Date().toISOString(),
        lead_brief_id: leadBrief.id
      }
    })
  }
  
  return accounts
}

async function generateAIContacts(
  leadBrief: LeadBriefInput,
  count: number,
  enrichmentLevel: string,
  accounts: GeneratedAccount[] = []
): Promise<GeneratedContact[]> {
  // This is a placeholder implementation
  // In a real implementation, this would call an AI service or use data providers
  
  const contacts: GeneratedContact[] = []
  
  for (let i = 0; i < count; i++) {
    const randomAccount = accounts.length > 0 ? accounts[Math.floor(Math.random() * accounts.length)] : null
    
    contacts.push({
      id: crypto.randomUUID(),
      account_id: randomAccount?.id,
      full_name: `Generated Contact ${i + 1}`,
      title: getRandomTitle(),
      seniority: getRandomSeniority(),
      dept: getRandomDepartment(),
      email_pattern_hint: `contact${i + 1}@${randomAccount?.domain || 'company.com'}`,
      email_status: 'UNKNOWN',
      provenance: {
        source: 'AI_GENERATED',
        model: 'placeholder',
        confidence: 0.8,
        enrichment_level,
        generated_at: new Date().toISOString(),
        lead_brief_id: leadBrief.id
      }
    })
  }
  
  return contacts
}

function getRandomCountry(geography: string): string {
  const countries = {
    'US': ['United States', 'Canada'],
    'EU': ['Germany', 'France', 'Netherlands', 'Sweden'],
    'UK': ['United Kingdom', 'Ireland'],
    'APAC': ['Australia', 'Singapore', 'Japan', 'India']
  }
  
  const geoCountries = countries[geography as keyof typeof countries] || countries['US']
  return geoCountries[Math.floor(Math.random() * geoCountries.length)]
}

function getRandomTitle(): string {
  const titles = [
    'CEO', 'CTO', 'VP of Engineering', 'VP of Sales', 'VP of Marketing',
    'Director of Product', 'Director of Sales', 'Director of Marketing',
    'Senior Software Engineer', 'Product Manager', 'Sales Manager',
    'Marketing Manager', 'Business Development Manager'
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

function getRandomSeniority(): 'C-LEVEL' | 'VP' | 'DIR' | 'IC' {
  const seniorities: ('C-LEVEL' | 'VP' | 'DIR' | 'IC')[] = ['C-LEVEL', 'VP', 'DIR', 'IC']
  return seniorities[Math.floor(Math.random() * seniorities.length)]
}

function getRandomDepartment(): string {
  const departments = [
    'Engineering', 'Sales', 'Marketing', 'Product', 'Operations',
    'Finance', 'HR', 'Customer Success', 'Business Development'
  ]
  return departments[Math.floor(Math.random() * departments.length)]
}
