'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthDebug from '@/components/AuthDebug'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  
  // Get redirect URL from search params (this is safe for SSR)
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')


    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })


      if (error) {
        setError(`Login failed: ${error.message}`)
      } else {
        router.push(redirectUrl)
        router.refresh()
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForceSessionRefresh = async () => {
    setLoading(true)
    setError('')

    try {
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        return
      }
      
      if (!session) {
        setError('No session found. Please log in first.')
        return
      }
      
      
      // Force refresh the session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`User error: ${userError.message}`)
        return
      }
      
      
      // Force a full page refresh to establish server-side session
      window.location.href = '/dashboard'
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to FulQrun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sales operations platform with PEAK + MEDDPICC
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
                  />
                </svg>
                <span className="ml-2">Microsoft</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
        
        {/* Force Session Refresh Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleForceSessionRefresh}
            disabled={loading}
            className="w-full inline-flex justify-center py-2 px-4 border border-yellow-300 rounded-md shadow-sm bg-yellow-50 text-sm font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Force Session Refresh (Debug)
          </button>
        </div>
        
        {/* Debug Panel */}
        <div className="mt-8">
          <AuthDebug />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
