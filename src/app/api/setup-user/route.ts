import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientComponentClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create default organization if it doesn't exist
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Organization',
        domain: user.email?.split('@')[1] || 'example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orgError && !orgError.message.includes('duplicate key')) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        role: 'admin', // First user is admin
        organization_id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError && !userError.message.includes('duplicate key')) {
      console.error('Error creating user:', userError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create default dashboard layout
    const { data: layoutData, error: layoutError } = await supabase
      .from('user_dashboard_layouts')
      .upsert({
        user_id: user.id,
        widgets: [],
        layout_config: {},
        is_default: true,
        organization_id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (layoutError && !layoutError.message.includes('duplicate key')) {
      console.error('Error creating dashboard layout:', layoutError)
      // Don't fail the whole request for this
    }

    return NextResponse.json({ 
      success: true, 
      user: userData,
      organization: orgData,
      layout: layoutData
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
