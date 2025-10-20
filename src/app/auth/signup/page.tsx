'use client'

import { AuthClientService } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import Link from 'next/link'
import { HeroBackground } from '@/components/marketing/hero-bg'

const SignupPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState<string>('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const auth = AuthClientService.getClient()
  // const db = getSupabaseBrowserClient() // no direct DB calls on signup page; use server APIs

  // Load organizations via server API (bypasses client-side RLS)
  useEffect(() => {
    let mounted = true
    async function loadOrgs() {
      try {
        const res = await fetch('/api/organizations/public', { cache: 'no-store' })
        if (!res.ok) {
          setOrgsError('Failed to load organizations')
          return
        }
        const payload = await res.json()
        const list = (payload?.organizations ?? []) as Array<{ id: string; name: string }>
        if (mounted) {
          setOrganizations(list)
          const livful = list.find(o => o.name?.toLowerCase?.() === 'livful inc.')
          if (livful) setSelectedOrgId(livful.id)
        }
      } catch {
        setOrgsError('Failed to load organizations')
      } finally {
        if (mounted) setOrgsLoading(false)
      }
    }
    loadOrgs()
    return () => { mounted = false }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!selectedOrgId) {
        setError('Please select an organization')
        setLoading(false)
        return
      }

      // Sign up the user with Supabase Auth and attach org/role metadata for server reconcile
      const { data: authData, error: authError } = await auth.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: { organization_id: selectedOrgId, role: 'admin', full_name: fullName },
        },
      })

      if (authError) {
        setError(`Failed to create user: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Reconcile server-side to create profiles with service-role and honor RLS
        const rec = await fetch('/api/profile/reconcile', { method: 'POST' })
        if (!rec.ok) {
          try {
            const j = await rec.json()
            setError(`Profile reconcile failed${j?.message ? `: ${j.message}` : ''}`)
          } catch {
            setError('Profile reconcile failed')
          }
          return
        }

        // Redirect to auth callback to establish session
        router.push('/auth/callback?next=/dashboard')
      } else {
        setError('Signup failed: No user data returned')
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Image + Overlays */}
      <div aria-hidden className="absolute inset-0">
        <HeroBackground />
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl ring-1 ring-white/20 p-8 space-y-8">
          <div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
              Create your FulQrun account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Get started with sales operations management
            </p>
          </div>

          <form className="mt-2 space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Kwame Appiah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  id="organizationId"
                  name="organizationId"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={orgsLoading || organizations.length === 0}
                >
                  <option value="" disabled>
                    {orgsLoading ? 'Loading organizations…' : (organizations.length ? 'Select organization' : 'No organizations found')}
                  </option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Default: LivFul Inc.</p>
                {orgsError && (
                  <p className="mt-1 text-xs text-red-600">{orgsError}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="kwame@livful.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
