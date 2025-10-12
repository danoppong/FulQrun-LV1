// API Route: Organization Data Management
// Handles CRUD operations for departments, regions, and countries

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'

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

// Types
interface OrganizationDataItem {
  id: string
  type: 'department' | 'region' | 'country'
  name: string
  code?: string | null
  description?: string | null
  is_active: boolean
  parent_id?: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

const organizationDataSchema = z.object({
  type: z.enum(['department', 'region', 'country']),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().optional(), // For hierarchical relationships
})

// GET /api/admin/organization/data - List organization data items
// Query params: type (department|region|country), isActive (true|false)
export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = await getOrgIfAdmin(user.id)
    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type')
    const isActiveFilter = url.searchParams.get('isActive')

    // Try to select from organization_data table first, fall back to existing logic
    let query = supa
      .from('organization_data' as const)
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (typeFilter && ['department', 'region', 'country'].includes(typeFilter)) {
      query = query.eq('type', typeFilter)
    }

    if (isActiveFilter === 'true' || isActiveFilter === 'false') {
      query = query.eq('is_active', isActiveFilter === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.warn('organization_data table not found, falling back to existing user data extraction')
      
      // Check if the error is because the table doesn't exist
      if (error && typeof error === 'object' && 'message' in error && 
          typeof (error as { message: string }).message === 'string' && 
          (error as { message: string }).message.includes('organization_data')) {
        return NextResponse.json({ 
          error: 'organization_data table not found',
          details: 'Please run the database migration first. Visit /api/admin/migrate-organization-data to create the table.',
          fallback: true,
          data: await extractFromUserTables(supa, organizationId, typeFilter)
        }, { 
          status: 200, // Return 200 with fallback data
          headers: { 'Cache-Control': 'private, max-age=60' } 
        })
      }
      
      // Fallback: extract from existing user tables
      const fallbackData = await extractFromUserTables(supa, organizationId, typeFilter)
      return NextResponse.json({ data: fallbackData }, { headers: { 'Cache-Control': 'private, max-age=60' } })
    }

    return NextResponse.json({ data: data || [] }, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to fetch organization data', details: (error as Error).message }, { status })
  }
}

// POST /api/admin/organization/data - Create new organization data item
export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = await getOrgIfAdmin(user.id)
    const body = await request.json()
    const parsed = organizationDataSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
    }

    const { type, name, code, description, isActive, parentId } = parsed.data

    // Check if name already exists for this type and organization
    const { data: existing } = await supa
      .from('organization_data' as const)
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', type)
      .eq('name', name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Duplicate name', details: `${type} with name "${name}" already exists` }, { status: 409 })
    }

    // Create the record
    type InsertClient = {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: () => { single: () => Promise<{ data: OrganizationDataItem | null; error: unknown }> }
        }
      }
    }
    const { data: newItem, error } = await (supa as unknown as InsertClient)
      .from('organization_data' as const)
      .insert({
        organization_id: organizationId,
        type,
        name,
        code: code || null,
        description: description || null,
        is_active: isActive !== false, // default to true
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating organization data:', error)
      
      // Check if the error is because the table doesn't exist
      if (error && typeof error === 'object' && 'message' in error && 
          typeof (error as { message: string }).message === 'string' && 
          (error as { message: string }).message.includes('organization_data')) {
        return NextResponse.json({ 
          error: 'organization_data table not found',
          details: 'Please run the database migration first. You can do this by making a POST request to /api/admin/migrate-organization-data',
          migrationNeeded: true
        }, { status: 424 }) // 424 Failed Dependency
      }
      
      return NextResponse.json({ error: 'Failed to create item', details: String((error as Error).message || error) }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to create organization data', details: (error as Error).message }, { status })
  }
}

// Helper function to extract data from existing user tables (fallback)
async function extractFromUserTables(supa: unknown, organizationId: string, typeFilter?: string | null) {
  const results: OrganizationDataItem[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supaClient = supa as any // Type assertion for legacy table access

  if (!typeFilter || typeFilter === 'department') {
    // Extract departments from users table
    try {
      const { data } = await supaClient
        .from('users' as const)
        .select('department')
        .eq('organization_id', organizationId)
        .not('department', 'is', null)

      const departments = new Set<string>()
      for (const row of (data || [])) {
        const dept = (row.department || '').trim()
        if (dept) departments.add(dept)
      }

      for (const dept of departments) {
        results.push({
          id: `dept_${dept.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'department',
          name: dept,
          code: null,
          description: null,
          is_active: true,
          parent_id: null,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Failed to extract departments:', e)
    }
  }

  if (!typeFilter || typeFilter === 'region') {
    // Extract regions from user_profiles
    try {
      const { data } = await supaClient
        .from('user_profiles' as const)
        .select('region, territory_name, territory')
        .eq('organization_id', organizationId)

      const regions = new Set<string>()
      for (const row of (data || [])) {
        const region = (row.region || row.territory_name || row.territory || '').trim()
        if (region) regions.add(region)
      }

      for (const region of regions) {
        results.push({
          id: `region_${region.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'region',
          name: region,
          code: null,
          description: null,
          is_active: true,
          parent_id: null,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Failed to extract regions:', e)
    }
  }

  if (!typeFilter || typeFilter === 'country') {
    // Extract countries from user_profiles
    try {
      const { data } = await supaClient
        .from('user_profiles' as const)
        .select('country')
        .eq('organization_id', organizationId)
        .not('country', 'is', null)

      const countries = new Set<string>()
      for (const row of (data || [])) {
        const country = (row.country || '').trim()
        if (country) countries.add(country)
      }

      for (const country of countries) {
        results.push({
          id: `country_${country.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'country',
          name: country,
          code: null,
          description: null,
          is_active: true,
          parent_id: null,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Failed to extract countries:', e)
    }
  }

  return results
}