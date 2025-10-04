import { getSupabaseClient } from '@/lib/supabase-client'

// Types for better type safety
export type AuthUser = {
  id: string
  email: string | undefined
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

// Client-side authentication service
export class AuthClientService {
  /**
   * Get or create client-side Supabase client
   * Uses singleton pattern to prevent multiple instances
   * Always returns a valid client (never null)
   */
  static getClient(): {
    auth: {
      getUser: () => Promise<{ data: { user: Record<string, unknown> | null }; error: Error | null }>
      getSession: () => Promise<{ data: { session: Record<string, unknown> | null }; error: Error | null }>
      signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: Record<string, unknown> | null; session: Record<string, unknown> | null }; error: Error | null }>
      signUp: (credentials: { email: string; password: string; options?: Record<string, unknown> }) => Promise<{ data: { user: Record<string, unknown> | null; session: Record<string, unknown> | null }; error: Error | null }>
      signOut: () => Promise<{ error: Error | null }>
      onAuthStateChange: (callback: (event: string, session: Record<string, unknown> | null) => void) => { data: { subscription: { unsubscribe: () => void } } }
    }
  } {
    return getSupabaseClient()
  }

  /**
   * Get current authenticated user with profile
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = this.getClient()
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
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.profile.organization_id)
      .single()

    return organization
  }

}

// Export convenience functions for backward compatibility
export const createClientComponentClient = () => AuthClientService.getClient()
export const getUser = () => AuthClientService.getCurrentUser()
export const requireAuth = () => AuthClientService.requireAuth()
export const requireRole = (roles: string[]) => AuthClientService.requireRole(roles)
export const getOrganization = () => AuthClientService.getCurrentOrganization()
