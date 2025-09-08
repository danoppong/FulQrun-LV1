'use client'
import { createClientComponentClient } from '@/lib/auth'
import { useEffect, useState } from 'react'

const AuthDebug = () => {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      
      // Test session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Test user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      setAuthState({
        session,
        sessionError,
        user,
        userError,
        timestamp: new Date().toISOString()
      })
      setLoading(false)
    }
    
    checkAuth()
    
    // Check auth state every 5 seconds
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">Loading auth state...</div>
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-xs">
      <h3 className="font-bold mb-2">🔍 Auth Debug Panel</h3>
      <div className="space-y-2">
        <div>
          <strong>Session:</strong> {authState?.session ? '✅ Active' : '❌ None'}
        </div>
        <div>
          <strong>User:</strong> {authState?.user ? `✅ ${authState.user.email}` : '❌ None'}
        </div>
        {authState?.sessionError && (
          <div className="text-red-600">
            <strong>Session Error:</strong> {authState.sessionError.message}
          </div>
        )}
        {authState?.userError && (
          <div className="text-red-600">
            <strong>User Error:</strong> {authState.userError.message}
          </div>
        )}
        <div className="text-gray-500">
          Last checked: {authState?.timestamp}
        </div>
      </div>
    </div>
  )
}

export default AuthDebug
