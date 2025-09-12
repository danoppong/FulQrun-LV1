'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthClientService } from '@/lib/auth-client'
import { User } from '@supabase/supabase-js'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthWrapper({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = AuthClientService.getClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          // Auth check error - redirect if required
          if (requireAuth) {
            router.push(redirectTo)
            return
          }
        }
        
        setUser(user)
      } catch (err) {
        // Unexpected auth error - redirect if required
        if (requireAuth) {
          router.push(redirectTo)
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' && requireAuth) {
          router.push(redirectTo)
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [requireAuth, redirectTo, router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect
  }

  return <>{children}</>
}
