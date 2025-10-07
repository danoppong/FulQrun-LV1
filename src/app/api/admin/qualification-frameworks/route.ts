import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin or Super Admin access required' },
        { status: 403 }
      )
    }

    // Get user's organization
    const { data: orgProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!orgProfile) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get qualification framework settings for the organization
    const { data: frameworks, error } = await supabase
      .from('qualification_framework_settings')
      .select('*')
      .eq('organization_id', orgProfile.organization_id)

    if (error) {
      console.error('Error fetching framework settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch framework settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        frameworks: frameworks || []
      }
    })

  } catch (error) {
    console.error('Error in qualification frameworks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin or Super Admin access required' },
        { status: 403 }
      )
    }

    // Get user's organization
    const { data: orgProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!orgProfile) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { frameworks } = body

    if (!frameworks || !Array.isArray(frameworks)) {
      return NextResponse.json(
        { error: 'Frameworks array is required' },
        { status: 400 }
      )
    }

    // Delete existing settings for the organization
    console.log('Attempting to delete settings for organization:', orgProfile.organization_id)
    const { error: deleteError } = await supabase
      .from('qualification_framework_settings')
      .delete()
      .eq('organization_id', orgProfile.organization_id)

    if (deleteError) {
      console.error('Error deleting existing settings:', deleteError)
      console.error('Delete error details:', JSON.stringify(deleteError, null, 2))
      return NextResponse.json(
        { error: `Failed to delete existing settings: ${deleteError.message}`, details: deleteError },
        { status: 500 }
      )
    }
    console.log('Successfully deleted existing settings')

    // Insert new settings (only if there are frameworks to insert)
    if (frameworks.length > 0) {
      const settingsToInsert = frameworks.map(framework => ({
        organization_id: orgProfile.organization_id,
        framework_id: framework.id,
        framework_name: framework.name,
        framework_full_name: framework.fullName,
        framework_description: framework.description,
        framework_fields: framework.fields,
        enabled: framework.enabled,
        created_by: user.id,
        updated_by: user.id
      }))

      const { error: insertError } = await supabase
        .from('qualification_framework_settings')
        .insert(settingsToInsert)

      if (insertError) {
        console.error('Error inserting framework settings:', insertError)
        console.error('Insert error details:', JSON.stringify(insertError, null, 2))
        return NextResponse.json(
          { error: `Failed to save framework settings: ${insertError.message}`, details: insertError },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Qualification framework settings saved successfully'
    })

  } catch (error) {
    console.error('Error in qualification frameworks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
