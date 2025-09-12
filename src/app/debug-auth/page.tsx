'use client'

import { useEffect, useState } from 'react'
import { AuthClientService } from '@/lib/auth-client'
import { supabaseConfig } from '@/lib/config'

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = AuthClientService.getClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        setAuthState({
          config: supabaseConfig,
          session: sessionError ? { error: sessionError.message } : session,
          user: userError ? { error: userError.message } : user,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        setAuthState({
          config: supabaseConfig,
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  if (loading) {
    return <div>Loading auth debug info...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(authState, null, 2)}
      </pre>
    </div>
  )
}