'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from '@/lib/supabase-singleton'

export default function AuthSessionGuard() {
  const [handled, setHandled] = useState(false)

  useEffect(() => {
    if (handled) return

    const supabase = getSupabaseBrowserClient()

    const sub = supabase.auth.onAuthStateChange(async (_event, _session) => {
      // noop; but keep the subscription alive
    })

    // Patch console.error to detect Invalid Refresh Token during init
    const originalError: (...args: unknown[]) => void = console.error
    console.error = (...args: unknown[]) => {
      try {
        const str = args.map((a: unknown) => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ')
        if (str.includes('Invalid Refresh Token')) {
          // Clear broken session and force a re-auth
          try { localStorage.removeItem('fulqrun-auth') } catch {}
          try { localStorage.removeItem('supabase.auth.token') } catch {}
          document.cookie = 'sb-access-token=; Max-Age=0; path=/'
          document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
          resetSupabaseBrowserClient()
          setHandled(true)
        }
      } catch {}
      return originalError(...args)
    }

    return () => {
      sub.data.subscription.unsubscribe()
      console.error = originalError
    }
  }, [handled])

  // Optional: provide a button in dev to reconcile user profile
  if (process.env.NODE_ENV === 'development') {
    return (
      <button
        className="fixed bottom-2 right-2 text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded shadow"
        onClick={async () => {
          try {
            await fetch('/api/profile/reconcile', { method: 'POST' })
          } catch {}
        }}
        aria-label="Reconcile Profile"
      >
        Reconcile Profile
      </button>
    )
  }

  return null
}
