'use client'
import { createClientComponentClient } from '@/lib/auth'
import { useEffect, useState } from 'react'

const TestAuthPage = () => {
  const [authState, setAuthState] = useState<{
    session: Record<string, unknown> | null
    sessionError: Error | null
    user: Record<string, unknown> | null
    userError: Error | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const testAuth = async () => {
      const supabase = createClientComponentClient()
      
      // Test session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Test user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      setAuthState({
        session,
        sessionError,
        user,
        userError
      })
      setLoading(false)
    }
    
    testAuth()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Client-Side Auth Test</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ session: authState?.session, sessionError: authState?.sessionError }, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ user: authState?.user, userError: authState?.userError }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestAuthPage
