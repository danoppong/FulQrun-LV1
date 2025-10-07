import { NextResponse } from 'next/server'
import { createClientComponentClient } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = createClientComponentClient()
    
    // Test if we can connect to the database
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (orgError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: orgError.message,
        hint: 'You may need to run the database migration in Supabase'
      })
    }

    // Test if we can access the users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Users table not accessible',
        details: userError.message,
        hint: 'You may need to run the database migration in Supabase'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      organizations: orgs,
      users: users
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
