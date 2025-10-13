import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit, opportunityBulkImportSchema, getClientIpFromHeaders } from '@/lib/validation'

const TABLE = 'opportunities'
const CHUNK_SIZE = 300

export async function POST(request: NextRequest) {
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

    const organizationId = profile.organization_id as string

    const body = await request.json()
    const parsed = opportunityBulkImportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
    }

    const rows = parsed.data.rows.map(r => {
      const value = typeof r.value === 'number' ? r.value : (typeof r.deal_value === 'number' ? r.deal_value : null)
      return {
        name: r.name,
        description: r.description ?? null,
        value,
        probability: r.probability ?? 0,
        stage: r.stage ?? 'prospecting',
        close_date: r.close_date ?? null,
        company_id: r.company_id ?? null,
        contact_id: r.contact_id ?? null,
        assigned_to: r.assigned_to ?? user.id,
        external_id: r.external_id ?? null,
        organization_id: organizationId,
        created_by: user.id,
      }
    })

    let inserted = 0
    let failed = 0
    const errors: Array<{ index: number; message: string }> = []

    type InsertResult = { error: { message: string } | null }
    type InsertClient = { from: (table: string) => { insert: (rows: unknown[]) => Promise<InsertResult> } }
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE)
      const { error } = await (supabase as unknown as InsertClient).from(TABLE).insert(chunk as unknown[])
      if (error) {
        failed += chunk.length
        errors.push({ index: i, message: error.message })
      } else {
        inserted += chunk.length
      }
    }

    return NextResponse.json({ success: true, inserted, failed, errors })
  } catch (error) {
    console.error('Bulk opportunities import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
