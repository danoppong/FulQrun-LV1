/**
 * Global Supabase Client Singleton
 * 
 * This file provides a single, globally shared Supabase client instance
 * to prevent multiple GoTrueClient instances from being created.
 * 
 * IMPORTANT: All client-side Supabase access should import from this file.
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config'
import type { Database } from '@/lib/types/supabase';

// Global singleton client instance for browser
let browserClientInstance: ReturnType<typeof createClient<Database>> | null = null

/**
 * Get the global singleton Supabase client for browser/client-side use
 * This ensures only ONE GoTrueClient is created per browser context
 */
export function getSupabaseBrowserClient() {
  // Return existing instance if already created
  if (browserClientInstance) {
    return browserClientInstance
  }

  // Check if Supabase is configured
  if (!supabaseConfig.isConfigured) {
    console.warn('Supabase is not configured. Using mock client.')
    browserClientInstance = createMockBrowserClient()
    return browserClientInstance
  }

  // Create the singleton instance
  try {
    browserClientInstance = createClient<Database>(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        auth: {
          persistSession: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'fulqrun-auth', // Use consistent storage key
        },
      }
    )
    console.log('✅ Supabase browser client initialized (singleton)')
  } catch (error) {
    console.error('Failed to create Supabase browser client:', error)
    browserClientInstance = createMockBrowserClient()
  }

  return browserClientInstance
}

/**
 * Create a server client for API routes and server components
 * Note: Server clients are NOT singletons as they need cookie context per request
 */
export function createSupabaseServerClient(cookieStore: {
  get: (name: string) => { value: string } | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove: (name: string, options: CookieOptions) => void
}) {
  if (!supabaseConfig.isConfigured) {
    return createMockBrowserClient()
  }

  return createServerClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Cookie setting can fail in some contexts (e.g., middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.remove(name, options)
          } catch (error) {
            // Cookie removal can fail in some contexts
          }
        },
      },
    }
  )
}

/**
 * Reset the browser client singleton (useful for testing or logout)
 */
export function resetSupabaseBrowserClient() {
  if (browserClientInstance) {
    console.log('🔄 Resetting Supabase browser client')
    browserClientInstance = null
  }
}

/**
 * Create a mock client for development/testing when Supabase is not configured
 */
function createMockBrowserClient() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: { message: 'Supabase not configured' } as unknown,
      }),
      getSession: async () => ({
        data: { session: null },
        error: { message: 'Supabase not configured' } as unknown,
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase not configured' } as unknown,
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase not configured' } as unknown,
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({
        data: { provider: null as unknown, url: null as unknown },
        error: { message: 'Supabase not configured' } as unknown,
      }),
      onAuthStateChange: (_callback: (event: string, session: any) => void) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Database not configured' } }),
          limit: async () => ({ data: null, error: { message: 'Database not configured' } }),
        }),
        order: () => ({
          single: async () => ({ data: null, error: { message: 'Database not configured' } }),
        }),
        limit: async () => ({ data: [], error: null }),
      }),
      insert: (_data: unknown) => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'Database not configured' } }),
        }),
      }),
      update: (_data: unknown) => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } }),
          }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ error: { message: 'Database not configured' } }),
      }),
    }),
  } as unknown
}
