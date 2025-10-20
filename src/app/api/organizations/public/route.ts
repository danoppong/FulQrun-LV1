import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'
import { checkRateLimit } from '@/lib/validation'

/**
 * Public organizations list (id, name only)
 * Server-side, uses service role if available to avoid RLS issues during signup.
 */
function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const xri = req.headers.get('x-real-ip')?.trim()
  // In local/dev, fall back to a stable token to avoid blocking everything
  return xff || xri || '127.0.0.1'
}

export async function GET(req: Request) {
  try {
    // Basic rate limiting to prevent enumeration
    const ip = getClientIp(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: false, message: 'Rate limit exceeded' }, { status: 429 })
    }

    const url = supabaseConfig.url
    if (!url) {
      return NextResponse.json({ ok: false, message: 'Supabase URL not configured' }, { status: 500 })
    }

    // Try RPC with anon first (preferred, no service-role required)
    if (supabaseConfig.anonKey) {
      const anon = createClient(url, supabaseConfig.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      const rpc = await anon.rpc('get_public_organizations')
      if (!rpc.error && rpc.data) {
        const organizations = (rpc.data as Array<{ id: string; name: string }>).map(o => ({ id: o.id, name: o.name }))
        return NextResponse.json(
          { ok: true, organizations },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
          }
        )
      }
    }

    // Fallback: direct select using service-role (if available)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch organizations (no RPC and no service role)' }, { status: 500 })
    }
    const supa = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supa.from('organizations').select('id,name').order('name', { ascending: true }) as unknown as { data: Array<{ id: string; name: string }>; error: { message: string } | null }
    if (error) {
      const status = String(error.message).toLowerCase().includes('permission') ? 403 : 500
      return NextResponse.json({ ok: false, message: 'Failed to fetch organizations', error: error.message }, { status })
    }
  const organizations = (data ?? []).map((o) => ({ id: o.id, name: o.name }))
    return NextResponse.json(
      { ok: true, organizations },
      {
        status: 200,
        headers: {
          // Public data can be cached briefly to reduce backend load
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
