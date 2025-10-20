import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit, validateSearchParams } from '@/lib/validation'

function getIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

const listSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  includeRegions: z.coerce.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const url = new URL(request.url)
  const { search, limit, includeRegions } = validateSearchParams(listSchema, url.searchParams)

    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve org from users table (avoids user_profiles RLS recursion)
    const { data: up, error: upErr } = await supabase
      .from('users' as const)
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })
    const orgId = (up as unknown as { organization_id?: string } | null)?.organization_id
    if (!orgId) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })

    // Try selecting full_name; on error fall back to aliasing email -> full_name
    const buildQuery = (useEmailAlias = false) => {
      let q = supabase
        .from('users' as const)
        .select(useEmailAlias ? 'id, full_name:email, role' : 'id, full_name, role')
        .eq('organization_id', orgId)
        .order(useEmailAlias ? 'email' : 'full_name', { ascending: true })
      if (search) q = q.ilike(useEmailAlias ? 'email' : 'full_name', `%${search}%`)
      if (limit) q = q.limit(limit)
      return q
    }

    let data: unknown = null
    let err: { message?: string } | null = null
    {
      const { data: d, error } = await buildQuery(false)
      data = d
      err = error as { message?: string } | null
    }
    if (err) {
      const { data: d2, error: e2 } = await buildQuery(true)
      data = d2
      err = e2 as { message?: string } | null
    }
    if (err) return NextResponse.json({ error: err.message || 'Failed to list users' }, { status: 400 })

    // Optional enrichment with region/country/business_unit from user_profiles
    let enriched = data as Array<{ id: string; full_name: string | null; role?: string | null }>
    if (includeRegions && Array.isArray(enriched) && enriched.length > 0) {
      const ids = enriched.map((u) => u.id).filter(Boolean)
      if (ids.length > 0) {
        try {
          const { data: up } = await supabase
            .from('user_profiles' as const)
            .select('id, region, country, business_unit')
            .in('id', ids)
            .eq('organization_id', orgId)

          if (Array.isArray(up) && up.length > 0) {
            const map = new Map<string, { region?: string | null; country?: string | null; business_unit?: string | null }>()
            for (const row of up as Array<{ id: string; region?: string | null; country?: string | null; business_unit?: string | null }>) {
              if (row?.id) map.set(row.id, { region: row.region ?? null, country: row.country ?? null, business_unit: row.business_unit ?? null })
            }
            enriched = enriched.map((u) => ({ ...u, ...(map.get(u.id) ?? { region: null, country: null, business_unit: null }) }))
          }
        } catch (_e) {
          // Best-effort; ignore enrichment errors
        }
      }
    }

    return new NextResponse(JSON.stringify({ data: enriched }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
