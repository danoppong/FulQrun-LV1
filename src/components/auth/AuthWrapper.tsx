'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/auth'
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
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth check error:', error)
          if (requireAuth) {
            router.push(redirectTo)
            return
          }
        }
        
        setUser(user)
      } catch (err) {
        console.error('Unexpected auth error:', err)
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
