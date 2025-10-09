import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

// Minimal type for stored templates
interface RoleTemplate {
  id: string
  organization_id: string
  role: string
  name: string
  layout_json: unknown
  is_default?: boolean
  published_at: string
  updated_at: string
}

// GET /api/dashboard/templates?role=salesman
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const role = url.searchParams.get('role') || undefined
    const supabase = await AuthService.getServerClient()
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = user.profile.organization_id
    // Build query with conditional role filter
    const base = (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (c: string, v: string) => { order: (c2: string, opts: { ascending: boolean }) => Promise<{ data: RoleTemplate[] | null; error: unknown }> }
          order: (c2: string, opts: { ascending: boolean }) => Promise<{ data: RoleTemplate[] | null; error: unknown }>
        }
      }
    })
      .from('dashboard_role_templates')
      .select('*')
      .eq('organization_id', orgId)

    const { data, error } = role
      ? await (base as unknown as { eq: (c: string, v: string) => { order: (c2: string, opts: { ascending: boolean }) => Promise<{ data: RoleTemplate[] | null; error: unknown }> } }).eq('role', role).order('is_default', { ascending: false })
      : await (base as unknown as { order: (c2: string, opts: { ascending: boolean }) => Promise<{ data: RoleTemplate[] | null; error: unknown }> }).order('is_default', { ascending: false })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST /api/dashboard/templates  { role, name, layout }
export async function POST(req: Request) {
  try {
    const supabase = await AuthService.getServerClient()
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = user.profile.organization_id
    const body = (await req.json()) as { role?: string; name?: string; layout?: unknown; isDefault?: boolean }
    const role = body.role || user.profile.role
    const name = body.name || 'Published Layout'
    const isDefault = Boolean(body.isDefault)

    if (isDefault) {
      await (supabase as unknown as {
        from: (t: string) => { update: (vals: unknown) => { eq: (c: string, v: string) => { eq: (c2: string, v2: string) => Promise<{ error: unknown }> } } }
      })
        .from('dashboard_role_templates')
        .update({ is_default: false })
        .eq('organization_id', orgId)
        .eq('role', role)
    }
    const payload = {
      organization_id: orgId,
      role,
      name,
      layout_json: body.layout ?? null,
      is_default: isDefault,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (values: unknown) => { select: (cols: string) => Promise<{ data: RoleTemplate[] | null; error: unknown }> }
      }
    })
      .from('dashboard_role_templates')
      .insert(payload)
      .select('*')

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data: (data || [])[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH to set/unset default flag for a template
export async function PATCH(req: Request) {
  try {
    const supabase = await AuthService.getServerClient()
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = user.profile.organization_id
    const body = (await req.json()) as { id?: string; isDefault?: boolean }
    if (!body.id) return NextResponse.json({ error: 'Missing template id' }, { status: 400 })

    const { data: template, error: fetchErr } = await (supabase as unknown as {
      from: (t: string) => { select: (cols: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: RoleTemplate | null; error: unknown }> } } }
    })
      .from('dashboard_role_templates')
      .select('*')
      .eq('id', body.id)
      .single()
    if (fetchErr || !template) return NextResponse.json({ error: fetchErr || 'Not found' }, { status: 404 })
    if (template.organization_id !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const setDefault = Boolean(body.isDefault)
    if (setDefault) {
      await (supabase as unknown as {
        from: (t: string) => { update: (vals: unknown) => { eq: (c: string, v: string) => { eq: (c2: string, v2: string) => Promise<{ error: unknown }> } } }
      })
        .from('dashboard_role_templates')
        .update({ is_default: false })
        .eq('organization_id', orgId)
        .eq('role', template.role)
    }

    const { data: updated, error } = await (supabase as unknown as {
      from: (t: string) => { update: (vals: unknown) => { eq: (c: string, v: string) => { select: (cols: string) => Promise<{ data: RoleTemplate[] | null; error: unknown }> } } }
    })
      .from('dashboard_role_templates')
      .update({ is_default: setDefault, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select('*')
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data: (updated || [])[0] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
