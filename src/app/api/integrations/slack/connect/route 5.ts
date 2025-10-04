import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, accessToken } = body

    if (!organizationId || !accessToken) {
      return NextResponse.json(
        { error: 'Organization ID and access token are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if Slack connection already exists
    const { data: existingConnection } = await supabase
      .from('integration_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'slack')
      .single()

    const credentials = {
      access_token: accessToken
    }

    if (existingConnection) {
      // Update existing connection
      const { error } = await supabase
        .from('integration_connections')
        .update({
          credentials: JSON.stringify(credentials),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)

      if (error) {
        throw error
      }

      return NextResponse.json({
        id: existingConnection.id,
        message: 'Slack connection updated successfully'
      })
    } else {
      // Create new connection
      const { data: newConnection, error } = await supabase
        .from('integration_connections')
        .insert({
          organization_id: organizationId,
          integration_type: 'slack',
          credentials: JSON.stringify(credentials),
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        id: newConnection.id,
        message: 'Slack connection created successfully'
      })
    }
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to save Slack connection' },
      { status: 500 }
    )
  }
}
