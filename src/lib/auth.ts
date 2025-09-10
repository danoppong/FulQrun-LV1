import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

// Singleton client instance to prevent multiple GoTrueClient instances
let clientInstance: any = null

export const createClientComponentClient = () => {
  // Always return singleton instance to prevent multiple GoTrueClient instances
  if (clientInstance) {
    return clientInstance
  }
  
  // Create and cache the client instance with error handling
  try {
    clientInstance = createClient(supabaseConfig.url!, supabaseConfig.anonKey!, {
      auth: {
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return mock client if creation fails
    clientInstance = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Supabase client creation failed' } }),
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
        })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase client creation failed' } })
          }),
          order: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase client creation failed' } })
          })
        }),
        insert: (data: any) => {
          const result = { data: null, error: { message: 'Supabase client creation failed' } }
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
              single: async () => ({ data: null, error: { message: 'Supabase client creation failed' } })
            })
          })
        }),
        delete: () => ({
          eq: async () => ({ error: { message: 'Supabase client creation failed' } })
        })
      })
    }
  }
  return clientInstance
}

