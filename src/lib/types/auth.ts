// Authentication types

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
    getUser: () => Promise<{ data: { user: any } | null; error: any }>
    getSession: () => Promise<{ data: { session: any } | null; error: any }>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: any; error: any }>
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<{ data: any; error: any }>
    signOut: () => Promise<{ error: any }>
    signInWithOAuth: (options: { provider: string; options?: any }) => Promise<{ error: any }>
    exchangeCodeForSession: (code: string) => Promise<{ data: any; error: any }>
  }
  from: (table: string) => SupabaseQueryBuilder
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseSelectBuilder
  insert: (data: any) => SupabaseInsertBuilder
  update: (data: any) => SupabaseUpdateBuilder
  delete: () => SupabaseDeleteBuilder
}

export interface SupabaseSelectBuilder {
  eq: (column: string, value: any) => SupabaseSelectBuilder
  order: (column: string, options?: { ascending?: boolean }) => SupabaseSelectBuilder
  single: () => Promise<{ data: any; error: any }>
  then: (callback: (result: { data: any; error: any }) => void) => Promise<any>
}

export interface SupabaseInsertBuilder {
  select: () => SupabaseSelectBuilder
  then: (callback: (result: { data: any; error: any }) => void) => Promise<any>
}

export interface SupabaseUpdateBuilder {
  eq: (column: string, value: any) => SupabaseUpdateBuilder
  select: () => SupabaseSelectBuilder
  then: (callback: (result: { data: any; error: any }) => void) => Promise<any>
}

export interface SupabaseDeleteBuilder {
  eq: (column: string, value: any) => Promise<{ error: any }>
  then: (callback: (result: { error: any }) => void) => Promise<any>
}
