'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import Link from 'next/link' // Unused import;
import dynamic from 'next/dynamic';

// Dynamic imports for dashboard components
const HierarchicalPerformanceDashboard = dynamic(() => import('@/components/dashboard/HierarchicalPerformanceDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>,
  ssr: false
})
const SalesmanDashboard = dynamic(() => import('@/components/dashboard/SalesmanDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>,
  ssr: false
})
const PipelineChart = dynamic(() => import('@/components/dashboard/PipelineChart'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>,
  ssr: false
})
import { UserRole } from '@/lib/roles'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthWrapper } from '@/components/auth/AuthWrapper';

// Function to create user record when they don't exist in database
async function createUserRecord(user: unknown, supabase: any) {
  try {
    // First, create a default organization if it doesn't exist
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Organization',
        domain: user.email?.split('@')[1] || 'example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orgError && !orgError.message.includes('duplicate key')) {
      console.error('Error creating organization:', orgError)
      return
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        role: 'admin', // First user is admin
        organization_id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError && !userError.message.includes('duplicate key')) {
      console.error('Error creating user:', userError)
    } else {
      console.log('User record created successfully')
    }
  } catch (error) {
    console.error('Error in createUserRecord:', error)
  }
}

const DashboardPage = () => {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  )
}

const DashboardContent = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(UserRole.SALESMAN)
  const [userName, setUserName] = useState<string>('User')
  const [userRegion, setUserRegion] = useState<string>('North America')
  const [userBusinessUnit, setUserBusinessUnit] = useState<string>('Enterprise')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  // Using singleton supabase client from lib/supabase.ts

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
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single()
          
          if (profileError) {
            console.warn('Failed to load user profile:', profileError.message)
            
            // If user doesn't exist in database, create them via API
            if (profileError.code === 'PGRST116' || profileError.message.includes('No rows found')) {
              console.log('User not found in database, creating user record via API...')
              try {
                const response = await fetch('/api/setup-user', { method: 'POST' })
                if (response.ok) {
                  console.log('User record created successfully via API')
                } else {
                  console.warn('Failed to create user record via API:', await response.text())
                }
              } catch (apiError) {
                console.warn('Error calling setup-user API:', apiError)
              }
            }
            
            // Continue with default values if profile loading fails
          } else if (userProfile) {
            if (userProfile.role) {
              setUserRole(userProfile.role as UserRole)
            }
            if (userProfile.full_name) {
              setUserName(userProfile.full_name)
            }
          }
        } catch (profileError) {
          console.warn('Error loading user profile:', profileError)
          // Continue with default values
        }
        
        setLoading(false)
        
      } catch (error) {
        setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [supabase, router])

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
