// src/app/dashboard/page.tsx
// Main dashboard page - Role-based dashboard routing
// Shows appropriate dashboard based on user role

import PremiumEnhancedDashboard from '@/components/dashboard/PremiumEnhancedDashboard';
import PremiumSalesmanDashboard from '@/components/dashboard/PremiumSalesmanDashboard';
import DashboardClientWrapper from '@/components/dashboard/DashboardClientWrapper';
import { UserRole } from '@/lib/roles';
import { AuthService } from '@/lib/auth-unified';
import { redirect } from 'next/navigation';
// no direct cookies usage here; server client handles it

type QuerySingle<T> = Promise<{ data: T | null; error: unknown }>
type SupabaseSelect = { eq: (col: string, val: string) => { single: () => QuerySingle<{ name?: string }> } }
type SupabaseFrom = { select: (cols: string) => SupabaseSelect }
type SupabaseMinimal = { from: (table: string) => SupabaseFrom }

async function getOrganizationNameSSR(orgId: string | null) {
  if (!orgId) return null;
  try {
    // Use unified server client and a minimal typed surface for this query
    const sb = (await AuthService.getServerClient()) as unknown as SupabaseMinimal
    const { data, error } = await sb.from('organizations').select('name').eq('id', orgId).single();
    if (error) return null;
    return (data as { name?: string } | null)?.name ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  // CRITICAL SECURITY: Server-side auth validation
  const user = await AuthService.getCurrentUserServer();
  
  // SECURITY: Immediate redirect if no authenticated user
  if (!user) {
    redirect('/auth/login?next=/dashboard')
  }
  
  // SECURITY: Validate user has profile and organization
  if (!user.profile?.organization_id) {
    redirect('/auth/login?next=/dashboard&error=missing-organization')
  }
  
  const role = (user?.profile?.role as UserRole) || UserRole.SALESMAN;
  const orgId = user?.profile?.organization_id ?? null;
  const orgName = await getOrganizationNameSSR(orgId);

  // Route to appropriate dashboard based on role
  // Admin and Super Admin have access to all dashboards via role selector in PremiumEnhancedDashboard
  const isSalesman = role === UserRole.SALESMAN;

  return (
    <DashboardClientWrapper>
      <div className="min-h-screen bg-gray-50">
        {!isSalesman && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Pharmaceutical Sales Dashboard</h1>
                  <p className="text-gray-600">Real-time analytics and performance insights</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href="/dashboard/builder" className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">Open Builder</a>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Enhanced Version
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSalesman ? (
          <PremiumSalesmanDashboard 
            userId={user?.id || 'anonymous'}
            userRole={role}
            organizationId={orgId || ''}
            darkMode={false}
          />
        ) : (
          <PremiumEnhancedDashboard 
            userRole={role}
            userId={user?.id || 'anonymous'}
            organizationNameSSR={orgName}
            organizationId={orgId}
          />
        )}
      </div>
    </DashboardClientWrapper>
  );
}
