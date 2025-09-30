import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test if specific tables exist by trying to query them
    const tablesToCheck = [
      'organizations',
      'users', 
      'companies',
      'contacts',
      'leads',
      'opportunities',
      'activities',
      'integrations',
      'user_profiles',
      'user_dashboard_layouts'
    ]
    
    const existingTables = []
    
    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          existingTables.push(tableName)
        }
      } catch (_e) {
        // Table doesn't exist or has issues
      }
    }

    return NextResponse.json({ 
      success: true, 
      tables: existingTables
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      tables: []
    })
  }
}
