// API Route: User Management
// Handles listing and creating users

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit, validateRequest, validateSearchParams } from '@/lib/validation'
import { supabaseConfig } from '@/lib/config'

function getIp(request: NextRequest) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }

async function getOrgIfAdmin(userId: string) {
  const supa = await AuthService.getServerClient()
  const { data, error } = await supa
    .from('users' as const)
    .select('organization_id, role')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) throw new HttpError(404, 'User not found')
  const role = (data as { role?: string }).role || ''
  if (!['admin', 'super_admin'].includes(role)) throw new HttpError(403, 'Insufficient permissions')
  return (data as { organization_id: string }).organization_id
}

// GET /api/admin/users - List all users in the organization
// Query params:
// - search: optional string to filter by name/email (case-insensitive)
// - limit: number of rows to return (1..1000)
// - offset: starting index (0-based)
// - includeRegions: 'true' | 'false' to enrich each user with region/country from user_profiles
// - role: optional exact role filter (rep|manager|admin|super_admin or org-specific)
// - department: optional exact department filter
// Response JSON:
// {
//   users: Array<{ id, email, fullName, role, organizationId, ... }>,
//   totalCount?: number // total matching rows (for pagination)
// }
const listSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).max(100000).optional(),
  includeRegions: z.enum(['true', 'false']).optional(),
  role: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
})

export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = await getOrgIfAdmin(user.id)
    const url = new URL(request.url)
  const { search, limit, offset, includeRegions: includeRegionsStr, role, department } = validateSearchParams(listSchema, url.searchParams)
  const includeRegions = includeRegionsStr === 'true'

    // Safe select: attempt richer fields then fall back if schema lacks them
  const selectPrimary = 'id, email, full_name, role, organization_id, manager_id, created_at, updated_at'
  const selectExtended = selectPrimary + ', last_login_at, mfa_enabled, enterprise_role, department, cost_center, hire_date'
  const selectEmailAsFullName = 'id, email, full_name:email, role, organization_id, manager_id, created_at, updated_at'

    type UserRow = {
      id: string
      email: string | null
      full_name: string | null
      role: string | null
      organization_id: string
      manager_id: string | null
      created_at: string
      updated_at: string
      last_login_at?: string | null
      mfa_enabled?: boolean | null
      enterprise_role?: string | null
      department?: string | null
      cost_center?: string | null
      hire_date?: string | null
    }

    const buildQuery = (sel: string, useEmailAlias = false) => {
      let q = supa
        .from('users' as const)
        .select(sel)
        .eq('organization_id', organizationId)
        .order(useEmailAlias ? 'email' : 'full_name', { ascending: false })
      if (search) q = q.ilike(useEmailAlias ? 'email' : 'full_name', `%${search}%`)
      if (role) q = q.eq('role', role)
      if (department) q = q.eq('department', department)
      if (typeof offset === 'number' && typeof limit === 'number') q = q.range(offset, offset + limit - 1)
      else if (typeof limit === 'number') q = q.limit(limit)
      return q
    }

    let users: UserRow[] | null = null
    let ok = false
    // Try extended with name filter
    {
      const { data, error } = await buildQuery(selectExtended)
      if (!error && Array.isArray(data)) { users = data as UserRow[]; ok = true }
    }
    if (!ok) {
      const { data, error } = await buildQuery(selectPrimary)
      if (!error && Array.isArray(data)) { users = data as UserRow[]; ok = true }
    }
    if (!ok) {
      const { data } = await buildQuery(selectEmailAsFullName, true)
      users = (data as UserRow[] | null)
    }

    let transformed = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name || '',
      role: u.role,
      enterpriseRole: u.enterprise_role ?? null,
      organizationId: u.organization_id,
      department: u.department ?? null,
      managerId: u.manager_id ?? null,
      lastLoginAt: u.last_login_at ?? null,
      isActive: true,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      mfaEnabled: u.mfa_enabled ?? null,
      hireDate: u.hire_date ?? null,
      costCenter: u.cost_center ?? null,
      // placeholders for enrichment
      region: null as string | null,
      country: null as string | null,
    }))

    // Optional enrichment: region/country from user_profiles when requested
    try {
      if (includeRegions && transformed.length > 0) {
        const ids = transformed.map((u) => u.id)
        // Try selecting common columns; fall back gracefully if schema differs
        type ProfRow = { user_id: string; region?: string | null; country?: string | null; business_unit?: string | null; territory_name?: string | null; territory?: string | null }
        let regions: ProfRow[] | null = null
        {
          const { data, error } = await supa
            .from('user_profiles' as const)
            .select('user_id, region, country, business_unit')
            .in('user_id', ids)
            .eq('organization_id', organizationId)
          if (!error && Array.isArray(data)) regions = data as ProfRow[]
        }
        if (!regions) {
          const { data, error } = await supa
            .from('user_profiles' as const)
            .select('user_id, territory_name, country')
            .in('user_id', ids)
            .eq('organization_id', organizationId)
          if (!error && Array.isArray(data)) regions = data as ProfRow[]
        }
        if (!regions) {
          const { data } = await supa
            .from('user_profiles' as const)
            .select('user_id, territory, country')
            .in('user_id', ids)
            .eq('organization_id', organizationId)
          regions = (data as ProfRow[] | null) ?? null
        }
        if (regions) {
          const map = new Map<string, { region: string | null; country: string | null }>()
          for (const r of regions) {
            const reg = (r.region ?? r.territory_name ?? r.territory ?? null) || null
            map.set(r.user_id, { region: reg, country: r.country ?? null })
          }
          transformed = transformed.map((u) => {
            const m = map.get(u.id)
            return m ? { ...u, region: m.region, country: m.country } : u
          })
        }
      }
    } catch { /* ignore enrichment errors */ }

    // Optional enrichment: reflect banned status from auth admin as isActive=false
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceKey && transformed.length > 0) {
        const { createClient } = await import('@supabase/supabase-js')
        const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const map = new Map<string, string | null>()
        if (Array.isArray(list?.users)) {
          for (const au of list.users) map.set(au.id, (au as { banned_until?: string | null }).banned_until ?? null)
        }
        transformed = transformed.map((u) => {
          const bannedUntil = map.get(u.id) || null
          let isActive = true
          if (bannedUntil) {
            const ts = Date.parse(bannedUntil)
            isActive = Number.isFinite(ts) ? ts <= Date.now() : false
          }
          return { ...u, isActive }
        })
      }
    } catch { /* ignore enrichment errors */ }

    // totalCount for pagination (best-effort, schema-safe)
    let totalCount: number | undefined = undefined
    try {
      // Try counting with full_name filter first
      let countBase = supa
        .from('users' as const)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
      if (role) countBase = countBase.eq('role', role)
      if (department) countBase = countBase.eq('department', department)
      const withName = search ? countBase.ilike('full_name', `%${search}%`) : countBase
      const { count, error } = await withName
      if (!error && typeof count === 'number') {
        totalCount = count
      } else {
        // Fallback to email if full_name isn't present or count failed
        let countEmailBase = supa
          .from('users' as const)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
        if (role) countEmailBase = countEmailBase.eq('role', role)
        if (department) countEmailBase = countEmailBase.eq('department', department)
        const withEmail = search ? countEmailBase.ilike('email', `%${search}%`) : countEmailBase
        const { count: c2 } = await withEmail
        if (typeof c2 === 'number') totalCount = c2
      }
    } catch {
      // ignore count errors; API remains functional without totalCount
    }

    return NextResponse.json({ users: transformed, totalCount }, { headers: { 'Cache-Control': 'private, max-age=15' } })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to fetch users', details: (error as Error).message }, { status })
  }
}

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['rep', 'manager', 'admin', 'super_admin']).or(z.string()).transform((v) => (['rep','manager','admin','super_admin'].includes(v) ? v : 'rep')),
  department: z.string().optional(),
  managerId: z.string().uuid().nullable().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  region: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
})

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const organizationId = await getOrgIfAdmin(user.id)

  const input = validateRequest(createUserSchema, await request.json())
  const { email, fullName, role, department, managerId, password, isActive, region, country } = input

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })

    const admin = createClient(supabaseConfig.url!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: { full_name: fullName, organization_id: organizationId, role }
    })
    if (authError || !authData?.user) return NextResponse.json({ error: 'Failed to create auth user', details: authError?.message }, { status: 500 })

    // Insert row in users table (service role to avoid RLS issues)
    const { data: userRow, error: userErr } = await admin
      .from('users')
      .insert({ id: authData.user.id, email, full_name: fullName, role, organization_id: organizationId, department, manager_id: managerId ?? null })
      .select()
      .maybeSingle()
    if (userErr || !userRow) {
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user record', details: userErr?.message }, { status: 500 })
    }

    // Upsert profile attributes (region/country) if provided
    try {
      if (region !== undefined || country !== undefined) {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (region !== undefined) payload.region = region
        if (country !== undefined) payload.country = country
        await admin.from('user_profiles').upsert({ user_id: userRow.id, organization_id: organizationId, ...payload }, { onConflict: 'user_id' })
      }
    } catch (e) {
      console.warn('⚠️ Warning: Failed to upsert user_profiles on create', e)
    }

    // Respect initial active status: ban newly created user if requested inactive
    try {
      if (typeof isActive === 'boolean' && !isActive) {
        await admin.auth.admin.updateUserById(userRow.id, { ban_duration: '876000h' })
      }
    } catch (e) {
      console.warn('⚠️ Warning: Failed to set initial active status', e)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userRow.id,
        email: userRow.email,
        fullName: userRow.full_name,
        role: userRow.role,
        organizationId: userRow.organization_id,
        department: userRow.department ?? null,
        managerId: userRow.manager_id ?? null,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
        isActive: isActive === false ? false : true,
        region: region ?? null,
        country: country ?? null,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user', details: (error as Error).message }, { status: 500 })
  }
}

