'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-singleton';
import { supabaseConfig } from '@/lib/config';

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

function AuthWrapper({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [_user, setUser] = useState<{ id: string; email?: string; role?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!supabaseConfig.isConfigured) {
          console.log('Supabase not configured, skipping auth check')
          setIsAuthenticated(!requireAuth) // Allow access if auth not required
          setIsLoading(false)
          return
        }

        const supabase = getSupabaseBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          if (requireAuth) {
            router.push('/auth/login')
            return
          }
        } else {
          setIsAuthenticated(true)
          setUser(user)
          
          // Check role permissions if specified
          if (allowedRoles.length > 0 && user.user_metadata?.role) {
            if (!allowedRoles.includes(user.user_metadata.role)) {
              router.push('/dashboard') // Redirect to dashboard if insufficient permissions
              return
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (requireAuth) {
          router.push('/auth/login')
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}

export { AuthWrapper }
export default AuthWrapper
