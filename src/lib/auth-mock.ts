// Mock authentication for development/testing without Supabase
// This allows the app to run while you set up Supabase

export const createClientComponentClient = () => {
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: null
      }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: { message: 'Please set up Supabase to enable authentication' }
      }),
      signUp: async () => ({
        data: { user: null },
        error: { message: 'Please set up Supabase to enable authentication' }
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({
        error: { message: 'Please set up Supabase to enable authentication' }
      })
    },
    from: (_table: string) => ({
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

export const createServerComponentClient = () => {
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: null
      })
    },
    from: (_table: string) => ({
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

export const createMiddlewareClient = (_request: Request) => {
  return {
    supabase: {
      auth: {
        getSession: async () => ({
          data: { session: null }
        })
      }
    },
    response: {
      next: () => ({}),
      cookies: {
        set: () => {}
      }
    }
  }
}

export const getUser = async () => null
export const getOrganization = async () => null
export const requireAuth = async () => {
  throw new Error('Please set up Supabase to enable authentication')
}
export const requireRole = async () => {
  throw new Error('Please set up Supabase to enable authentication')
}
