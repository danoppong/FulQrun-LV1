// API Route: Admin Users Options
// Returns distinct department, region, and country values for the organization

import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

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

export async function GET(_request: NextRequest) {
  try {
    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const organizationId = await getOrgIfAdmin(user.id)

    // Departments from users table
    const departments = new Set<string>()
    try {
      const { data } = await supa
        .from('users' as const)
        .select('department')
        .eq('organization_id', organizationId)
      for (const row of (data as Array<{ department?: string | null }> | null) || []) {
        const d = (row.department || '').trim()
        if (d) departments.add(d)
      }
    } catch { /* ignore */ }

    // Regions and countries from user_profiles with safe fallbacks
    const regionSet = new Set<string>()
    const countrySet = new Set<string>()
    try {
      const { data } = await supa
        .from('user_profiles' as const)
        .select('region, territory_name, territory, country')
        .eq('organization_id', organizationId)
      for (const row of (data as Array<{ region?: string | null; territory_name?: string | null; territory?: string | null; country?: string | null }> | null) || []) {
        const region = (row.region || row.territory_name || row.territory || '').trim()
        const country = (row.country || '').trim()
        if (region) regionSet.add(region)
        if (country) countrySet.add(country)
      }
    } catch { /* ignore */ }

    const toSortedArray = (s: Set<string>) => Array.from(s).sort((a,b) => a.localeCompare(b))
    return NextResponse.json({
      departments: toSortedArray(departments),
      regions: toSortedArray(regionSet),
      countries: toSortedArray(countrySet),
    }, { headers: { 'Cache-Control': 'private, max-age=30' } })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to fetch options', details: (error as Error).message }, { status })
  }
}
