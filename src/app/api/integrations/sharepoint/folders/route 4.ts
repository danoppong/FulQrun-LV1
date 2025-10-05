import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SharePointIntegration } from '@/lib/integrations/sharepoint'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const siteId = searchParams.get('siteId')
    const folderPath = searchParams.get('folderPath') || '/'

    if (!organizationId || !siteId) {
      return NextResponse.json(
        { error: 'Organization ID and Site ID are required' },
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

    // Get folders
    const folders = await sharepoint.getFolders(siteId, folderPath)

    return NextResponse.json(folders)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch SharePoint folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, siteId, parentPath, folderName } = body

    if (!organizationId || !siteId || !folderName) {
      return NextResponse.json(
        { error: 'Organization ID, Site ID, and folder name are required' },
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

    // Create folder
    const folder = await sharepoint.createFolder(siteId, parentPath || '/', folderName)

    return NextResponse.json(folder)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
