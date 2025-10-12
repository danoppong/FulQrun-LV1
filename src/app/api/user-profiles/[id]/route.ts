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
    const { data: up, error: upErr } = await supabase
      .from('user_profiles' as const)
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })
    const orgId = (up as unknown as { organization_id?: string } | null)?.organization_id
    if (!orgId) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })

    // Primary read from users table
    const { data: userRow, error: userErr } = await supabase
      .from('users' as const)
      .select('id, email, full_name, role, organization_id, manager_id, enterprise_role, department, cost_center, hire_date, last_login_at, mfa_enabled, session_timeout_minutes, learning_progress, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })
  const base = (userRow as unknown) as { id: string; email: string | null; full_name: string | null; role: string | null; organization_id?: string; manager_id?: string | null; enterprise_role?: string | null; department?: string | null; cost_center?: string | null; hire_date?: string | null; last_login_at?: string | null; mfa_enabled?: boolean | null; session_timeout_minutes?: number | null; learning_progress?: Record<string, unknown> | null; created_at?: string | null; updated_at?: string | null } | null
    if (!base) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let managerId: string | null | undefined = base.manager_id ?? null
    if (managerId == null) {
      const { data: up, error: upErr } = await supabase
        .from('user_profiles' as const)
        .select('manager_id')
        .eq('id', id)
        .eq('organization_id', orgId)
        .maybeSingle()
      if (!upErr) {
        const upRow = (up as unknown) as { manager_id?: string | null } | null
        managerId = upRow?.manager_id ?? null
      }
    }
    // Best-effort: fetch optional fields from user_profiles
    let region: string | null = null
    let country: string | null = null
    let businessUnit: string | null = null
    {
      let upData: unknown = null
      let upErr: { message?: string } | null = null
      {
        const { data, error } = await supabase
          .from('user_profiles' as const)
          .select('region, country, business_unit')
          .eq('id', id)
          .eq('organization_id', orgId)
          .maybeSingle()
        upData = data
        upErr = error as { message?: string } | null
      }
      if (upErr) {
        const { data, error } = await supabase
          .from('user_profiles' as const)
          .select('region, business_unit')
          .eq('id', id)
          .eq('organization_id', orgId)
          .maybeSingle()
        upData = data
        upErr = error as { message?: string } | null
      }
      if (!upErr && upData) {
        const upRow = upData as { region?: string | null; country?: string | null; business_unit?: string | null }
        region = upRow.region ?? null
        country = upRow.country ?? null
        businessUnit = upRow.business_unit ?? null
      }
    }
    const row = { ...base, manager_id: managerId ?? null, region, country, business_unit: businessUnit }
    return new NextResponse(JSON.stringify({ data: row }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
