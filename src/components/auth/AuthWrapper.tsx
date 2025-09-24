'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/auth'

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
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient()
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
          if (allowedRoles.length > 0 && user.profile) {
            if (!allowedRoles.includes(user.profile.role)) {
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
