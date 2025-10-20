import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { bulkExportQuerySchema, getClientIpFromHeaders, checkRateLimit } from '@/lib/validation'
import { toCsv } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile || !profile.organization_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const url = new URL(request.url)
    const parsed = bulkExportQuerySchema.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 })
    }

    const { format, limit, status } = parsed.data

    let query = supabase
      .from('leads')
      .select('id,first_name,last_name,email,phone,company,source,status,created_at', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (format === 'json') {
      return NextResponse.json({ data: data || [] })
    }

    const csv = toCsv(data || [], [
      'id','first_name','last_name','email','phone','company','source','status','created_at'
    ])
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads_export.csv"',
        'Cache-Control': 'private, max-age=60'
      }
    })
  } catch (error) {
    console.error('Bulk leads export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
