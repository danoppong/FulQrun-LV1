import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit, validateRequest } from '@/lib/validation'

const updateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  manager_id: z.string().uuid().nullable().optional(),
})

function getIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

export async function GET() {
  try {
    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Primary read from users table (stable schema and avoids user_profiles recursion)
    const { data: userRow, error: userErr } = await supabase
      .from('users' as const)
      .select('id, email, full_name, role, organization_id, manager_id, enterprise_role, department, cost_center, hire_date, last_login_at, mfa_enabled, session_timeout_minutes, learning_progress, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })
  const profRaw = (userRow as unknown) as { id: string; email: string | null; full_name: string | null; role: string | null; organization_id?: string; manager_id?: string | null; enterprise_role?: string | null; department?: string | null; cost_center?: string | null; hire_date?: string | null; last_login_at?: string | null; mfa_enabled?: boolean | null; session_timeout_minutes?: number | null; learning_progress?: Record<string, unknown> | null; created_at?: string | null; updated_at?: string | null } | null
    if (!profRaw || !profRaw.organization_id) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })
    let managerId: string | null | undefined = profRaw.manager_id ?? null
    if (managerId == null) {
      const { data: up, error: upErr } = await supabase
        .from('user_profiles' as const)
        .select('manager_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!upErr) {
        const upRow = (up as unknown) as { manager_id?: string | null } | null
        managerId = upRow?.manager_id ?? null
      }
    }
    // Best-effort: fetch optional fields (region, country, business_unit) from user_profiles
    let region: string | null = null
    let country: string | null = null
    let businessUnit: string | null = null
    {
      // Try comprehensive select; on error, fallback to available columns
      let upData: unknown = null
      let upErr: { message?: string } | null = null
      {
        const { data, error } = await supabase
          .from('user_profiles' as const)
          .select('region, country, business_unit')
          .eq('id', user.id)
          .maybeSingle()
        upData = data
        upErr = error as { message?: string } | null
      }
      if (upErr) {
        const { data, error } = await supabase
          .from('user_profiles' as const)
          .select('region, business_unit')
          .eq('id', user.id)
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
    const result = { ...profRaw, manager_id: managerId ?? null, region, country, business_unit: businessUnit }
    return NextResponse.json({ data: result })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    const body = await request.json()
    const input = validateRequest(updateSchema, body)

    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing, error: readErr } = await supabase
      .from('user_profiles' as const)
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 400 })
    const existingRow = (existing as unknown) as { organization_id?: string } | null
    if (!existingRow || !existingRow.organization_id) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })

    const updateVals: Record<string, unknown> = {}
    if (Object.prototype.hasOwnProperty.call(input, 'full_name')) updateVals.full_name = input.full_name ?? null
    if (Object.prototype.hasOwnProperty.call(input, 'manager_id')) updateVals.manager_id = input.manager_id ?? null

    if (Object.keys(updateVals).length === 0) return NextResponse.json({ ok: true })

    type UpdateChain = { update: (vals: Record<string, unknown>) => { eq: (c1: string, v1: string) => { eq: (c2: string, v2: string) => Promise<{ error: { message: string } | null }> } } }
    const { error } = await ((supabase.from('user_profiles' as const) as unknown) as UpdateChain)
      .update(updateVals)
      .eq('id', user.id)
      .eq('organization_id', existingRow.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
