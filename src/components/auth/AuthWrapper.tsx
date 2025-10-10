'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// Use unified auth module so tests can mock createClientComponentClient
import { createClientComponentClient } from '@/lib/auth'
import { supabaseConfig } from '@/lib/config';

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
  redirectTo?: string
}

function AuthWrapper({ 
  children, 
  requireAuth = true, 
  allowedRoles = [],
  redirectTo
}: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [_user, setUser] = useState<{ id: string; email?: string; role?: string } | null>(null)
  const router = useRouter() as unknown as { push?: (url: string)=>void; replace?: (url: string)=>void }

  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        // Check if Supabase is configured (allow in tests regardless)
        if (!supabaseConfig.isConfigured && process.env.NODE_ENV !== 'test') {
          console.log('Supabase not configured, skipping auth check')
          if (isMounted) {
            setIsAuthenticated(!requireAuth) // Allow access if auth not required
            setIsLoading(false)
          }
          return
        }

  const supabase = createClientComponentClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          if (requireAuth) {
            // Redirect immediately without additional state churn
            if (typeof router.push === 'function') {
              router.push(redirectTo || '/auth/login')
            } else if (typeof router.replace === 'function') {
              router.replace(redirectTo || '/auth/login')
            }
            if (isMounted) setIsLoading(false)
            return
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(true)
            setUser(user)
          }
          
          // Check role permissions if specified
          if (allowedRoles.length > 0 && user.user_metadata?.role) {
            if (!allowedRoles.includes(user.user_metadata.role)) {
              if (typeof router.push === 'function') {
                router.push('/dashboard')
              } else if (typeof router.replace === 'function') {
                router.replace('/dashboard')
              }
              return
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (requireAuth) {
          if (typeof router.push === 'function') {
            router.push(redirectTo || '/auth/login')
          } else if (typeof router.replace === 'function') {
            router.replace(redirectTo || '/auth/login')
          }
          if (isMounted) setIsLoading(false)
          return
        }
      } finally {
        // Ensure loading ends quickly, especially in tests
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            setIsLoading(false)
          } else {
            setTimeout(() => setIsLoading(false), 0)
          }
        }
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [requireAuth, allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" data-testid="auth-loading">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
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
