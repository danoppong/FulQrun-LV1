import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { validateSearchParams, integrationsListSchema, checkRateLimit } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Integrations API: Starting request')
    
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`integrations:${clientIP}`, 30, 60000)) {
      console.log('Integrations API: Rate limit exceeded')
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    console.log('Integrations API: Search params:', Object.fromEntries(searchParams.entries()))
    
    // Validate input parameters
    const { organizationId } = validateSearchParams(
      integrationsListSchema,
      searchParams
    )
    console.log('Integrations API: Validated organizationId:', organizationId)

    const supabase = createServerClient()
    console.log('Integrations API: Supabase client created')

    // Get all active integrations for the organization
    const { data: integrations, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      console.error('Integrations API: Database error:', error)
      throw error
    }

    console.log('Integrations API: Success, found', integrations?.length || 0, 'integrations')
    return NextResponse.json(integrations || [])
  } catch (error) {
    console.error('Integrations API error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.startsWith('Validation error:')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}
