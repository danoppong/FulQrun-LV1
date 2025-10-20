import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await AuthService.getServerClient()
    // Try a lightweight select; if the relation doesn't exist, Supabase will return an error
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => { select: (cols?: string) => { limit: (n: number) => Promise<{ data: unknown; error: unknown }> } }
    })
      .from('user_dashboard_layouts')
      .select('id')
      .limit(1)

    if (error) {
      const err = error as { message?: string } | string | undefined
      const msg = typeof err === 'string' ? err : String(err?.message || 'Unknown error')
      const missing = msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('does not exist')
      return NextResponse.json({ exists: !missing, error: msg }, { status: missing ? 200 : 500 })
    }

    // If we get here, table exists and RLS permits a select for this user (it may return empty data)
    return NextResponse.json({ exists: true, sample: Array.isArray(data) && data.length ? data[0] : null }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ exists: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
