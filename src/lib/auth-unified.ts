import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/config'
import { Database } from '@/lib/supabase'

// Conditional import for server-side only
let cookies: any = null
if (typeof window === 'undefined') {
  try {
    cookies = require('next/headers').cookies
  } catch (error) {
    // cookies not available in client context
  }
}

// Types for better type safety
export type AuthUser = {
  id: string
  email: string
  profile?: {
    id: string
    email: string
    full_name: string | null
    role: 'rep' | 'manager' | 'admin'
    organization_id: string
    learning_progress: Record<string, unknown>
    created_at: string
    updated_at: string
  }
}

export type AuthSession = {
  user: AuthUser
  access_token: string
  refresh_token: string
}

// Unified authentication service
export class AuthService {
  private static clientInstance: ReturnType<typeof createClient> | null = null

  /**
   * Get or create client-side Supabase client
   * Uses singleton pattern to prevent multiple instances
   */
  static getClient() {
    if (this.clientInstance) {
      return this.clientInstance
    }

    if (!supabaseConfig.isConfigured) {
      // Return mock client for development
      this.clientInstance = this.createMockClient()
      return this.clientInstance
    }

    try {
      this.clientInstance = createClient(
        supabaseConfig.url!,
        supabaseConfig.anonKey!,
        {
          auth: {
            persistSession: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      this.clientInstance = this.createMockClient()
    }

    return this.clientInstance
  }

  /**
   * Get server-side Supabase client for API routes
   */
  static getServerClient() {
    if (!supabaseConfig.isConfigured) {
      return this.createMockClient()
    }

    if (!cookies) {
      // If cookies not available (client-side), return mock client
      return this.createMockClient()
    }

    const cookieStore = cookies()
    
    return createServerClient<Database>(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: string }) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: string }) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  }

  /**
   * Get middleware client for Next.js middleware
   */
  static getMiddlewareClient(request: NextRequest) {
    if (!supabaseConfig.isConfigured) {
      return {
        supabase: this.createMockClient(),
        response: NextResponse.next()
      }
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient<Database>(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: string }) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: string }) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    return { supabase, response }
  }

  /**
   * Get current authenticated user with profile
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = this.getClient()
    if (!supabase) return null
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return { ...user, profile: profile || undefined } as AuthUser
  }

  /**
   * Get current user on server side
   */
  static async getCurrentUserServer(): Promise<AuthUser | null> {
    const supabase = this.getServerClient()
    if (!supabase) return null
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return { ...user, profile: profile || undefined } as AuthUser
  }

  /**
   * Require authentication - throws if not authenticated
   */
  static async requireAuth(): Promise<AuthUser> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }

  /**
   * Require specific role - throws if not authorized
   */
  static async requireRole(allowedRoles: string[]): Promise<AuthUser> {
    const user = await this.getCurrentUser()
    if (!user?.profile) {
      throw new Error('Authentication required')
    }
    
    if (!allowedRoles.includes(user.profile.role)) {
      throw new Error('Insufficient permissions')
    }
    
    return user
  }

  /**
   * Get organization for current user
   */
  static async getCurrentOrganization() {
    const user = await this.getCurrentUser()
    if (!user?.profile) return null

    const supabase = this.getClient()
    if (!supabase) return null
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.profile.organization_id)
      .single()

    return organization
  }

  /**
   * Create mock client for development/testing
   */
  private static createMockClient() {
    return {
      auth: {
        getUser: async () => ({ 
          data: { user: null }, 
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
        onAuthStateChange: (callback: (event: string, session: unknown) => void) => ({
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
        insert: (data: unknown) => {
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
    } as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => Promise<{ data: unknown; error: { message: string } }> }; insert: (data: unknown) => Promise<{ data: unknown; error: { message: string } }>; update: (data: unknown) => { eq: (column: string, value: string) => Promise<{ data: unknown; error: { message: string } }> }; delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } }> } } }
  }
}

// Export convenience functions for backward compatibility
export const createClientComponentClient = () => AuthService.getClient()
export const createServerComponentClient = () => AuthService.getServerClient()
export const createMiddlewareClient = (request: NextRequest) => AuthService.getMiddlewareClient(request)
export const getUser = () => AuthService.getCurrentUser()
export const requireAuth = () => AuthService.requireAuth()
export const requireRole = (roles: string[]) => AuthService.requireRole(roles)
export const getOrganization = () => AuthService.getCurrentOrganization()
