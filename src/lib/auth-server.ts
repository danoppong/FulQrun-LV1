import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient, CookieOptions } from '@/lib/types/auth'
import { supabaseConfig } from '@/lib/config'

export const createServerComponentClient = () => {
  if (!supabaseConfig.isConfigured) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
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
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: 'Database not configured' } })
          })
        }),
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
  
  const cookieStore = cookies()
  
  return createServerClient(supabaseConfig.url || 'https://placeholder.supabase.co', supabaseConfig.anonKey || 'placeholder_key', {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

export const createMiddlewareClient = (request: NextRequest) => {
  if (!supabaseConfig.isConfigured) {
    return {
      supabase: {
        auth: {
          getSession: async () => ({ data: { session: null } }),
          exchangeCodeForSession: async () => ({ error: { message: 'Supabase not configured' } }),
          signOut: async () => ({ error: null })
        }
      },
      response: NextResponse.next()
    }
  }
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseConfig.url || 'https://placeholder.supabase.co', supabaseConfig.anonKey || 'placeholder_key', {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
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
      remove(name: string, options: CookieOptions) {
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
  })

  return { supabase, response }
}

export const getUser = async () => {
  const supabase = createServerComponentClient()
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

  return { ...user, profile }
}

export const getOrganization = async () => {
  const user = await getUser()
  if (!user?.profile) return null

  const supabase = createServerComponentClient()
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.profile.organization_id)
    .single()

  return organization
}

export const requireAuth = async () => {
  const user = await getUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const requireRole = async (allowedRoles: string[]) => {
  const user = await getUser()
  if (!user?.profile) {
    throw new Error('Authentication required')
  }
  
  if (!allowedRoles.includes(user.profile.role)) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}
