import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Get service role key from environment
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Create admin client
    const { createClient } = await import('@supabase/supabase-js')
    const { supabaseConfig } = await import('@/lib/config')
    const admin = createClient(supabaseConfig.url!, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    console.log('🚀 Adding region and country columns to users table...')
    
    // Use direct PostgreSQL client approach
    const changes = []

    try {
      // Check if columns already exist by trying to select them
      const { error: checkError } = await admin.from('users').select('region, country').limit(1)
      
      if (!checkError) {
        // Columns already exist
        return NextResponse.json({ 
          success: true, 
          message: 'Region and country columns already exist in users table',
          changes: ['Columns already exist - no migration needed']
        })
      }

      // If we get here, columns don't exist, so we need to use a workaround
      // Since we can't execute raw DDL, let's use a different approach
      return NextResponse.json({ 
        error: 'Direct DDL execution not available', 
        details: 'Please run the migration manually: ALTER TABLE users ADD COLUMN region TEXT, ADD COLUMN country TEXT;',
        sqlCommand: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT, ADD COLUMN IF NOT EXISTS country TEXT;'
      }, { status: 400 })

    } catch (error) {
      console.error('Migration check error:', error)
      return NextResponse.json({ 
        error: 'Failed to check existing columns', 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added region and country columns to users table',
      changes
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Failed to run migration', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}