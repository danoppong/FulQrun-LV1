/**
 * Salesman Dashboard KPI API Route
 * 
 * Provides RESTful endpoint for calculating salesman-specific KPIs
 * with hierarchical roll-up support for managers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { salesmanKPIEngine, type SalesmanKPIRequest } from '@/lib/services/salesman-kpi-engine'
import { AuthService } from '@/lib/auth-unified'

interface MinimalUserProfile { organization_id: string; role: string; manager_id?: string | null }

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/salesman-kpis
 * 
 * Query Parameters:
 * - salesmanId: string (required)
 * - viewMode: 'individual' | 'rollup' (default: 'individual')
 * - includeSubordinates: boolean (default: false)
 * - periodStart: ISO date string (default: start of current month)
 * - periodEnd: ISO date string (default: now)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (server-side)
    const supabase = await AuthService.getServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get organization and role from user_profiles, with fallback to legacy users table
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('organization_id, role, manager_id')
      .eq('id', user.id)
      .single()

    const profile = (profileData as MinimalUserProfile | null) ?? null
    let organizationId: string | null | undefined = profile?.organization_id ?? undefined
    let requesterRole: string | null | undefined = profile?.role ?? undefined

    if (!organizationId) {
      // Fallback: legacy public.users table (some modules still reference it)
      const { data: legacyUser } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      type LegacyUser = { organization_id: string | null; role: string | null } | null
      const legacy = legacyUser as LegacyUser
      if (legacy?.organization_id) {
        organizationId = legacy.organization_id
        requesterRole = requesterRole ?? legacy.role ?? undefined
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const salesmanId = searchParams.get('salesmanId') || user.id
  const viewMode = (searchParams.get('viewMode') || 'individual') as 'individual' | 'rollup'
    const includeSubordinates = searchParams.get('includeSubordinates') === 'true'

    // Parse date range (default to current month)
    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodStart = searchParams.get('periodStart') 
      ? new Date(searchParams.get('periodStart')!) 
      : defaultStart
    const periodEnd = searchParams.get('periodEnd')
      ? new Date(searchParams.get('periodEnd')!)
      : now

    // Validate date range
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      )
    }

    if (periodStart > periodEnd) {
      return NextResponse.json(
        { error: 'Period start must be before period end' },
        { status: 400 }
      )
    }

    // Authorization check for viewing other salesman's data
    if (salesmanId !== user.id) {
      // Admin and Super Admin have full access to all dashboards
      const isAdmin = ['admin', 'super_admin'].includes((requesterRole || '').toLowerCase())
      
      // Check if user is a manager, admin, or regional director
      if (!isAdmin && !['manager', 'regional_director'].includes((profile?.role || '').toLowerCase())) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view other salesman data' },
          { status: 403 }
        )
      }

      // For rollup view, verify the requesting user is the manager (unless admin/super_admin)
      if (viewMode === 'rollup' && includeSubordinates && !isAdmin) {
        const { data: targetSalesmanData } = await supabase
          .from('user_profiles')
          .select('manager_id')
          .eq('id', salesmanId)
          .single()

        const targetSalesman = (targetSalesmanData as { manager_id: string | null } | null) ?? null
        if (!targetSalesman || targetSalesman.manager_id !== user.id) {
          return NextResponse.json(
            { error: 'Can only view rollup data for your direct reports' },
            { status: 403 }
          )
        }
      }
    }

    // Build KPI request
    const kpiRequest: SalesmanKPIRequest = {
      salesmanId,
      organizationId: organizationId as string,
      periodStart,
      periodEnd,
      viewMode,
      includeSubordinates
    }

    // Calculate KPIs
    const results = await salesmanKPIEngine.calculateAllKPIs(kpiRequest)

    // Return results with cache headers
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Calculation-Time': new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Salesman KPI calculation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate KPIs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/salesman-kpis/batch
 * 
 * Calculate KPIs for multiple salesmen in a single request
 * Useful for team dashboards and manager views
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (server-side)
    const supabase = await AuthService.getServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get organization and role from user_profiles
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    const profile = (profileData as Pick<MinimalUserProfile, 'organization_id' | 'role'> | null) ?? null

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Only managers, admins, and super_admins can batch calculate
    const allowedRoles = ['manager', 'admin', 'super_admin', 'regional_director']
    if (!allowedRoles.includes((profile?.role || '').toLowerCase())) {
      return NextResponse.json(
        { error: 'Insufficient permissions for batch calculation' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { salesmanIds, periodStart, periodEnd, viewMode = 'individual' } = body

    if (!Array.isArray(salesmanIds) || salesmanIds.length === 0) {
      return NextResponse.json(
        { error: 'salesmanIds array is required' },
        { status: 400 }
      )
    }

    if (salesmanIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 salesmen per batch request' },
        { status: 400 }
      )
    }

    const start = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = periodEnd ? new Date(periodEnd) : new Date()

    // Calculate KPIs for all salesmen in parallel
    const results = await Promise.allSettled(
      salesmanIds.map(salesmanId =>
        salesmanKPIEngine.calculateAllKPIs({
          salesmanId,
          organizationId: profile.organization_id,
          periodStart: start,
          periodEnd: end,
          viewMode,
          includeSubordinates: false
        })
      )
    )

    // Separate successful and failed calculations
    const successful = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof salesmanKPIEngine.calculateAllKPIs>>> => r.status === 'fulfilled')
      .map(r => r.value)

    const failed = results
      .map((r, idx) => r.status === 'rejected' ? { salesmanId: salesmanIds[idx], error: r.reason } : null)
      .filter(Boolean)

    return NextResponse.json({
      successful,
      failed,
      summary: {
        total: salesmanIds.length,
        successCount: successful.length,
        failureCount: failed.length
      }
    })
  } catch (error) {
    console.error('Batch KPI calculation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate batch KPIs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
