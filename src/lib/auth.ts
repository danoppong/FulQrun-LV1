import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

// Singleton client instance to prevent multiple GoTrueClient instances
let clientInstance: any = null

export const createClientComponentClient = () => {
  // Return singleton instance if it exists and Supabase is configured
  if (clientInstance && supabaseConfig.isConfigured) {
    return clientInstance
  }
  if (!supabaseConfig.isConfigured) {
    // Return mock client for development
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured. Please set up your environment variables.' } 
        }),
        signUp: async () => ({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured. Please set up your environment variables.' } 
        }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ 
          error: { message: 'Supabase not configured. Please set up your environment variables.' } 
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
        insert: (data: any) => {
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
    }
  }
  
  // Create and cache the client instance
  clientInstance = createClient(supabaseConfig.url!, supabaseConfig.anonKey!, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  return clientInstance
}

