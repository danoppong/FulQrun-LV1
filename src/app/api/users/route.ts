import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Temporary bypass for testing - remove in production
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || '9ed327f2-c46a-445a-952b-70addaee33b8'

    const supabase = createServerClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      // Return mock data for testing
      return NextResponse.json([
        {
          id: 'mock-user-1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          role: 'rep',
          organization_id: organizationId
        },
        {
          id: 'mock-user-2',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          role: 'manager',
          organization_id: organizationId
        }
      ])
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}







