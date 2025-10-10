import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

type Row = { organization_id: string | null; role: string | null }
type SelectClient<T> = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: T | null; error: unknown }> }
    }
  }
}

export async function GET() {
  const supa = await AuthService.getServerClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })

  const upResp = await (supa as unknown as SelectClient<Row>)
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()
  const up = (upResp?.data ?? null) as { organization_id: string | null; role: string | null } | null

  if (up?.organization_id) {
    return NextResponse.json({
      ok: true,
      context: {
        userId: user.id,
        email: user.email,
        role: up.role,
        organizationId: up.organization_id,
        source: 'user_profiles',
      }
    })
  }

  const legacyResp = await (supa as unknown as SelectClient<Row>)
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()
  const legacy = (legacyResp?.data ?? null) as { organization_id: string | null; role: string | null } | null

  if (legacy?.organization_id) {
    return NextResponse.json({
      ok: true,
      context: {
        userId: user.id,
        email: user.email,
        role: legacy.role === 'rep' ? 'salesman' : legacy.role,
        organizationId: legacy.organization_id,
        source: 'users',
      }
    })
  }

  const claims = user.user_metadata as { organization_id?: string; role?: string }
  if (claims?.organization_id) {
    return NextResponse.json({
      ok: true,
      context: {
        userId: user.id,
        email: user.email,
        role: claims.role === 'rep' ? 'salesman' : claims.role ?? null,
        organizationId: claims.organization_id,
        source: 'claims',
      }
    })
  }

  return NextResponse.json({ ok: true, context: { userId: user.id, email: user.email, role: null, organizationId: null, source: 'unknown' } })
}
