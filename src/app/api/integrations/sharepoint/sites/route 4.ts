import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SharePointIntegration } from '@/lib/integrations/sharepoint'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get SharePoint connection
    const { data: connection, error: connectionError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'sharepoint')
      .eq('status', 'active')
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'SharePoint not connected' },
        { status: 404 }
      )
    }

    const credentials = JSON.parse(connection.credentials)
    const sharepoint = new SharePointIntegration(credentials.access_token)

    // Get SharePoint sites
    const sites = await sharepoint.getSites()

    return NextResponse.json(sites)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch SharePoint sites' },
      { status: 500 }
    )
  }
}
