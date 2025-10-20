import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'

function getIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

const paramsSchema = z.object({ id: z.string().uuid() })

export async function GET(request: Request, context: { params: unknown }) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    const { id } = paramsSchema.parse(context.params as Record<string, string>)
    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve org from current user
    let orgId: string | null = null
    try {
      const { data: up, error: upErr } = await supabase
        .from('user_profiles' as const)
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()
      if (upErr) {
        console.error('Error getting organization from user_profiles:', upErr)
        return NextResponse.json({ error: upErr.message }, { status: 400 })
      }
      orgId = (up as unknown as { organization_id?: string } | null)?.organization_id || null
      if (!orgId) {
        console.error('No organization found for user:', user.id)
        return NextResponse.json({ error: 'Missing organization' }, { status: 400 })
      }
    } catch (error) {
      console.error('Exception during organization lookup:', error)
      return NextResponse.json({ error: 'Organization lookup failed' }, { status: 500 })
    }

    // Primary read from users table (includes region/country after migration)
    let base: { 
      id: string; 
      email: string | null; 
      full_name: string | null; 
      role: string | null; 
      organization_id?: string; 
      manager_id?: string | null; 
      enterprise_role?: string | null; 
      department?: string | null; 
      cost_center?: string | null; 
      hire_date?: string | null; 
      last_login_at?: string | null; 
      mfa_enabled?: boolean | null; 
      session_timeout_minutes?: number | null; 
      learning_progress?: Record<string, unknown> | null;
      region?: string | null;
      country?: string | null;
      created_at?: string | null; 
      updated_at?: string | null;
    } | null = null
    
    try {
      const { data: userRow, error: userErr } = await supabase
        .from('users' as const)
        .select('id, email, full_name, role, organization_id, manager_id, enterprise_role, department, cost_center, hire_date, last_login_at, mfa_enabled, session_timeout_minutes, learning_progress, region, country, created_at, updated_at')
        .eq('id', id)
        .eq('organization_id', orgId)
        .maybeSingle()
      if (userErr) {
        console.error('Error querying users table:', userErr)
        return NextResponse.json({ error: userErr.message }, { status: 400 })
      }
      base = userRow as typeof base
      if (!base) {
        console.error('User not found in users table:', id, 'org:', orgId)
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('Exception during users table query:', error)
      return NextResponse.json({ error: 'Users query failed' }, { status: 500 })
    }
    
    // Fallback to user_profiles for region/country if not set in users table
    let region = base.region || null
    let country = base.country || null
    let businessUnit: string | null = null
    
    if (!region || !country) {
      try {
        const { data: upData } = await supabase
          .from('user_profiles' as const)
          .select('region, country, business_unit')
          .eq('id', id)
          .eq('organization_id', orgId)
          .maybeSingle()
        
        if (upData) {
          const upRow = upData as { region?: string | null; country?: string | null; business_unit?: string | null }
          region = region || upRow.region || null
          country = country || upRow.country || null
          businessUnit = upRow.business_unit || null
        }
      } catch (error) {
        // Ignore user_profiles errors, use what we have from users table
        console.warn('user_profiles fallback failed:', error)
      }
    }
    
    const row = { ...base, region, country, business_unit: businessUnit }
    return new NextResponse(JSON.stringify({ data: row }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
