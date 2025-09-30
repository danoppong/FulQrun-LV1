/**
 * Legacy Supabase Client Export
 * 
 * This file now re-exports the global singleton to prevent multiple GoTrueClient instances.
 * All imports from this file will use the same singleton instance.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/config'
import type { Database } from '@/lib/types/supabase'

// Export the singleton instance for browser use
export const supabase = getSupabaseBrowserClient()

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
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie setting might fail in some contexts
          }
        },
        remove(name: string, options: any) {
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

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = supabaseConfig.isConfigured
