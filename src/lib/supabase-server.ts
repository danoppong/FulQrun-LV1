/**
 * Server-Side Supabase Client
 * 
 * This file provides server-side Supabase functionality using next/headers.
 * Only use this in server components, API routes, and middleware.
 */

import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/config'
import type { Database } from '@/lib/types/supabase'

type CookieOptions = {
  path?: string
  domain?: string
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

// Helper function for server-side client creation (proper server client with auth context)
export function createServerClient() {
  const cookieStore = cookies()
  
  return createSSRClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie setting might fail in some contexts
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Cookie removal might fail in some contexts
          }
        },
      },
    }
  )
}
