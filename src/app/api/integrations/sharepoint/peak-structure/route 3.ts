import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SharePointIntegration } from '@/lib/integrations/sharepoint'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, siteId, opportunityId, opportunityName } = body

    if (!organizationId || !siteId || !opportunityId || !opportunityName) {
      return NextResponse.json(
        { error: 'Organization ID, Site ID, Opportunity ID, and Opportunity Name are required' },
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

    // Create PEAK folder structure
    const result = await sharepoint.createPEAKFolderStructure(
      siteId,
      opportunityId,
      opportunityName
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create PEAK structure' },
        { status: 500 }
      )
    }

    // Store folder structure in database
    if (result.folders) {
      const folderRecords = Object.entries(result.folders).map(([key, folderId]) => ({
      opportunity_id: opportunityId,
      folder_key: key,
      folder_id: folderId,
      created_at: new Date().toISOString()
    }))

      await supabase
        .from('sharepoint_documents')
        .upsert(folderRecords, { onConflict: 'opportunity_id,folder_key' })
    }

    return NextResponse.json({
      success: true,
      folders: result.folders,
      message: 'PEAK folder structure created successfully'
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create PEAK structure' },
      { status: 500 }
    )
  }
}
