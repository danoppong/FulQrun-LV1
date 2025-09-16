'use client'
import { AuthClientService } from '@/lib/auth-client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HierarchicalPerformanceDashboard from '@/components/dashboard/HierarchicalPerformanceDashboard'
import SalesmanDashboard from '@/components/dashboard/SalesmanDashboard'
import PipelineChart from '@/components/dashboard/PipelineChart'
import { UserRole } from '@/lib/roles'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AuthWrapper from '@/components/auth/AuthWrapper'

const DashboardPage = () => {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  )
}

const DashboardContent = () => {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole>(UserRole.SALESMAN)
  const [userName, setUserName] = useState<string>('User')
  const [userRegion, setUserRegion] = useState<string>('North America')
  const [userBusinessUnit, setUserBusinessUnit] = useState<string>('Enterprise')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = AuthClientService.getClient()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user (AuthWrapper already verified authentication)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(`User error: ${userError.message}`)
          setLoading(false)
          return
        }
        
        if (!user) {
          router.push('/auth/login')
          return
        }
        
        setUser(user)
        setUserName(user.email || 'User')
        
        // Load user role from database or user metadata
        const { data: userProfile } = await (supabase as any)
          .from('users')
          .select('role, full_name')
          .eq('id', user.id)
          .single()
        
        if (userProfile?.role) {
          setUserRole(userProfile.role as UserRole)
        }
        if (userProfile?.full_name) {
          setUserName(userProfile.full_name)
        }
        
        setLoading(false)
        
      } catch (error) {
        setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render different dashboards based on role
  if (userRole === UserRole.SALESMAN) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SalesmanDashboard 
            userId={user?.id || ''} 
            userName={userName}
          />
          <PipelineChart />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <HierarchicalPerformanceDashboard 
          userRole={userRole} 
          userId={user?.id || ''} 
          userName={userName}
          userRegion={userRegion}
          userBusinessUnit={userBusinessUnit}
        />
        <PipelineChart />
      </div>
    </ErrorBoundary>
  )
}

export default DashboardPage
