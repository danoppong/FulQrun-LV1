import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from '@/lib/config'

// Global singleton client instance
let globalClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Get the singleton Supabase client instance
 * This ensures only one GoTrueClient is created per browser context
 */
export function getSupabaseClient() {
  if (globalClient) {
    return globalClient
  }

  if (!supabaseConfig.isConfigured) {
    // Return mock client for development
    globalClient = {
      auth: {
        getUser: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        getSession: async () => ({ 
          data: { session: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } 
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ 
          error: { message: 'Supabase not configured' } 
        }),
        onAuthStateChange: (callback: (event: string) => void) => ({
          data: { subscription: { unsubscribe: () => {} } }
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } })
          }),
          order: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } })
          })
        }),
        insert: (data: Record<string, unknown>) => {
          const result = { data: null, error: { message: 'Database not configured' } }
          const promise = Promise.resolve(result)
          return Object.assign(promise, {
            select: () => ({
              single: async () => result
            })
          })
        },
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Database not configured' } })
            })
          })
        }),
        delete: () => ({
          eq: async () => ({ error: { message: 'Database not configured' } })
        })
      })
    } as any
    return globalClient
  }

  try {
    globalClient = createBrowserClient(supabaseConfig.url!, supabaseConfig.anonKey!)
    return globalClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return mock client if creation fails
    globalClient = {
      auth: {
        getUser: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase client creation failed' } 
        }),
        getSession: async () => ({ 
          data: { session: null }, 
          error: { message: 'Supabase client creation failed' } 
        }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase client creation failed' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase client creation failed' } 
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ 
          error: { message: 'Supabase client creation failed' } 
        }),
        onAuthStateChange: (callback: (event: string) => void) => ({
          data: { subscription: { unsubscribe: () => {} } }
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } })
          }),
          order: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } })
          })
        }),
        insert: (data: Record<string, unknown>) => {
          const result = { data: null, error: { message: 'Database not configured' } }
          const promise = Promise.resolve(result)
          return Object.assign(promise, {
            select: () => ({
              single: async () => result
            })
          })
        },
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Database not configured' } })
            })
          })
        }),
        delete: () => ({
          eq: async () => ({ error: { message: 'Database not configured' } })
        })
      })
    } as any
    return globalClient
  }
}

// Export for backward compatibility
export const createClientComponentClient = getSupabaseClient
