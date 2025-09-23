'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import { AuthUser } from '@/lib/auth-client'

export interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(userError.message)
        setUser(null)
        return
      }
      
      if (!authUser) {
        setUser(null)
        return
      }

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.warn('Profile not found:', profileError.message)
        // Still set user even without profile
        setUser({ ...authUser, profile: undefined } as AuthUser)
      } else {
        setUser({ ...authUser, profile } as AuthUser)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    error,
    signOut,
    refreshUser
  }
}
