import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { validateSearchParams, integrationsListSchema, checkRateLimit } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`integrations:${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Validate input parameters
    const { organizationId } = validateSearchParams(
      integrationsListSchema,
      searchParams
    )

    const supabase = createServerClient()

    // Get all active integrations for the organization
    const { data: integrations, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (error) {
      throw error
    }

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
