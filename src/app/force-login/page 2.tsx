'use client'
import { createClientComponentClient } from '@/lib/auth'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ForceLoginPage = () => {
  const [status, setStatus] = useState('Initializing...')
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({})
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setStatus('Page loaded, starting auth check...')
    
    const forceLogin = async () => {
      try {
        setStatus('Getting session...')
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        setDebugInfo({ session: !!session, sessionError: sessionError?.message })
        
        if (sessionError) {
          setStatus(`Session error: ${sessionError.message}`)
          return
        }
        
        if (!session) {
          setStatus('No session found, redirecting to login...')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        
        setStatus('Session found, getting user...')
        
        // Force refresh the session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        setDebugInfo((prev: Record<string, unknown>) => ({ ...prev, user: !!user, userError: userError?.message }))
        
        if (userError) {
          setStatus(`User error: ${userError.message}`)
          return
        }
        
        if (!user) {
          setStatus('No user found, redirecting to login...')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        
        setStatus('Authentication successful, redirecting to dashboard...')
        
        // Force a full page refresh to establish server-side session
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
        
      } catch (error) {
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setDebugInfo((prev: Record<string, unknown>) => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    }
    
    // Add a small delay to ensure the component is fully mounted
    setTimeout(forceLogin, 100)
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Force Login
          </h2>
          <p className="text-gray-600 mb-4">{status}</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          
          <div className="text-left text-sm text-gray-500 mt-4">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForceLoginPage
