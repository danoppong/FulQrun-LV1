import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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

    // Get SharePoint connection for the organization
    const { data: connection, error: _error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'sharepoint')
      .eq('status', 'active')
      .single()

    if (_error || !connection) {
      return NextResponse.json(
        { error: 'SharePoint not connected' },
        { status: 404 }
      )
    }

    // Decrypt credentials (in a real implementation, you'd use proper encryption)
    const credentials = JSON.parse(connection.credentials)

    return NextResponse.json({
      id: connection.id,
      integration_type: connection.integration_type,
      status: connection.status,
      credentials: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expires_at: credentials.expires_at
      },
      created_at: connection.created_at,
      updated_at: connection.updated_at
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to get SharePoint connection' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, accessToken, refreshToken, expiresAt } = body

    if (!organizationId || !accessToken) {
      return NextResponse.json(
        { error: 'Organization ID and access token are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('integration_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'sharepoint')
      .single()

    const credentials = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt
    }

    if (existingConnection) {
      // Update existing connection
      const { error: _error } = await supabase
        .from('integration_connections')
        .update({
          credentials: JSON.stringify(credentials),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)

      if (_error) {
        throw _error
      }

      return NextResponse.json({
        id: existingConnection.id,
        message: 'SharePoint connection updated successfully'
      })
    } else {
      // Create new connection
      const { data: newConnection, error: _error2 } = await supabase
        .from('integration_connections')
        .insert({
          organization_id: organizationId,
          integration_type: 'sharepoint',
          credentials: JSON.stringify(credentials),
          status: 'active'
        })
        .select()
        .single()

      if (_error2) {
        throw _error2
      }

      return NextResponse.json({
        id: newConnection.id,
        message: 'SharePoint connection created successfully'
      })
    }
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to save SharePoint connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Deactivate SharePoint connection
    const { error } = await supabase
      .from('integration_connections')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('integration_type', 'sharepoint')

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'SharePoint connection deactivated successfully'
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to deactivate SharePoint connection' },
      { status: 500 }
    )
  }
}
