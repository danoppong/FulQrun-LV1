import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

export async function POST() {
  try {
    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })

  type Row = { organization_id: string | null; role: string | null }
  type SelectClient<T> = {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: T | null; error: unknown }> }
      }
    }
  }
  // (removed unused UpsertClient helper)

    // Resolve context from user_profiles, fallback to legacy users, then claims
    const upResp = await (supa as unknown as SelectClient<Row>)
      .from('user_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .maybeSingle()
    const up = (upResp?.data ?? null) as { organization_id: string | null; role: string | null } | null

    let organizationId: string | null = up?.organization_id ?? null
    let role: string | null = up?.role ?? null

    if (!organizationId) {
      const legacyResp = await (supa as unknown as SelectClient<Row>)
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .maybeSingle()
      const legacy = (legacyResp?.data ?? null) as { organization_id: string | null; role: string | null } | null
      if (legacy?.organization_id) {
        organizationId = legacy.organization_id
        role = legacy.role === 'rep' ? 'salesman' : legacy.role
      }
    }

    if (!organizationId) {
      const claims = user.user_metadata as { organization_id?: string; role?: string }
      if (claims?.organization_id) {
        organizationId = claims.organization_id
        role = claims.role === 'rep' ? 'salesman' : claims.role ?? null
      }
    }

    if (!organizationId) {
      return NextResponse.json({ ok: false, message: 'Unable to resolve organization for user' }, { status: 400 })
    }

    // Prefer service-role client for upsert to bypass RLS safely (server-only)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ ok: false, message: 'Service role key not configured on server' }, { status: 500 })
    }

    const adminSupa = createClient(
      supabaseConfig.url!,
      serviceKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // Upsert user_profiles and legacy users with service-role
    const { error: profileErr } = await adminSupa
      .from('user_profiles')
      .upsert({ id: user.id, email: user.email, role: role ?? 'salesman', organization_id: organizationId, manager_id: null }, { onConflict: 'id' })

    const { error: legacyErr } = await adminSupa
      .from('users')
      .upsert({ id: user.id, email: user.email, role: role === 'salesman' ? 'rep' : (role ?? 'rep'), organization_id: organizationId, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    const ok = !profileErr && !legacyErr
    if (!ok) {
      // Build safe, string-only summaries to avoid circular JSON issues
      const profileMsg = profileErr?.message || ''
      const legacyMsg = legacyErr?.message || ''
      const combined = `${profileMsg} ${legacyMsg}`.toLowerCase()
      const status = combined.includes('permission denied') ? 403 : 500
      return NextResponse.json({ ok: false, message: 'Reconcile failed', errors: { profile: profileMsg || null, legacy: legacyMsg || null } }, { status })
    }

    return NextResponse.json({ ok, organizationId, role })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
