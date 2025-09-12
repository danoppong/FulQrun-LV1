import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Deactivate Slack connection
    const { error } = await supabase
      .from('integration_connections')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('integration_type', 'slack')

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Slack connection deactivated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to deactivate Slack connection' },
      { status: 500 }
    )
  }
}
