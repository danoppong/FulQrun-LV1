// Authentication types

export interface User {
  id: string
  email?: string
  phone?: string
  created_at: string
  updated_at?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  role?: string
  aud: string
  confirmation_sent_at?: string
  recovery_sent_at?: string
  email_change_sent_at?: string
  new_email?: string
  new_phone?: string
  invited_at?: string
  action_link?: string
  email_change?: string
  phone_change?: string
  reauthentication_token?: string
  reauthentication_sent_at?: string
  is_sso_user: boolean
  deleted_at?: string
  is_anonymous: boolean
  factors?: unknown[]
  identities?: unknown[]
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

export interface AuthResponse {
  data: {
    user: User | null
    session: Session | null
  } | null
  error: Error | null
}

export interface CookieOptions {
  name: string
  value: string
  expires?: Date
  maxAge?: number
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export interface SupabaseClient {
  auth: {
    getUser: () => Promise<AuthResponse>
    getSession: () => Promise<AuthResponse>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResponse>
    signUp: (credentials: { email: string; password: string; options?: Record<string, unknown> }) => Promise<AuthResponse>
    signOut: () => Promise<{ error: Error | null }>
    signInWithOAuth: (options: { provider: string; options?: Record<string, unknown> }) => Promise<{ error: Error | null }>
    exchangeCodeForSession: (code: string) => Promise<AuthResponse>
  }
  from: (table: string) => SupabaseQueryBuilder
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseSelectBuilder
  insert: (data: Record<string, unknown>) => SupabaseInsertBuilder
  update: (data: Record<string, unknown>) => SupabaseUpdateBuilder
  delete: () => SupabaseDeleteBuilder
}

export interface SupabaseSelectBuilder {
  eq: (column: string, value: string | number | boolean) => SupabaseSelectBuilder
  order: (column: string, options?: { ascending?: boolean }) => SupabaseSelectBuilder
  single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>
  then: (callback: (result: { data: Record<string, unknown> | null; error: Error | null }) => void) => Promise<unknown>
}

export interface SupabaseInsertBuilder {
  select: () => SupabaseSelectBuilder
  then: (callback: (result: { data: Record<string, unknown> | null; error: Error | null }) => void) => Promise<unknown>
}

export interface SupabaseUpdateBuilder {
  eq: (column: string, value: string | number | boolean) => SupabaseUpdateBuilder
  select: () => SupabaseSelectBuilder
  then: (callback: (result: { data: Record<string, unknown> | null; error: Error | null }) => void) => Promise<unknown>
}

export interface SupabaseDeleteBuilder {
  eq: (column: string, value: string | number | boolean) => Promise<{ error: Error | null }>
  then: (callback: (result: { error: Error | null }) => void) => Promise<unknown>
}
