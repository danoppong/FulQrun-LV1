import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/config'
import { Database } from '@/lib/supabase'
import { getSupabaseBrowserClient, createSupabaseServerClient } from '@/lib/supabase-singleton'

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
  /**
   * Get client-side Supabase client (singleton from global instance)
   */
  static getClient() {
    return getSupabaseBrowserClient()
  }

  /**
   * Get server-side Supabase client for API routes
   */
  static getServerClient() {
    if (!supabaseConfig.isConfigured || !cookies) {
      return getSupabaseBrowserClient() // Fall back to browser client if server context not available
    }

    const cookieStore = cookies()
    
    return createSupabaseServerClient({
      get(name: string) {
        return cookieStore.get(name)
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Cookie setting can fail in some contexts
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Cookie removal can fail in some contexts
        }
      },
    })
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

}

// Export convenience functions for backward compatibility
export const createClientComponentClient = () => AuthService.getClient()
export const createServerComponentClient = () => AuthService.getServerClient()
export const createMiddlewareClient = (request: NextRequest) => AuthService.getMiddlewareClient(request)
export const getUser = () => AuthService.getCurrentUser()
export const requireAuth = () => AuthService.requireAuth()
export const requireRole = (roles: string[]) => AuthService.requireRole(roles)
export const getOrganization = () => AuthService.getCurrentOrganization()
