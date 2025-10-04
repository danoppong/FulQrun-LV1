/**
 * Legacy Supabase Client Getter
 * 
 * This file now delegates to the global singleton to prevent multiple GoTrueClient instances.
 * Use this for backward compatibility with existing code.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'

/**
 * Get the singleton Supabase client instance
 * This ensures only one GoTrueClient is created per browser context
 * 
 * @deprecated Use getSupabaseBrowserClient from '@/lib/supabase-singleton' instead
 */
export function getSupabaseClient() {
  return getSupabaseBrowserClient()
}

// Re-export the singleton for convenience
export { getSupabaseBrowserClient } from '@/lib/supabase-singleton'

// Export for backward compatibility
export const createClientComponentClient = getSupabaseClient
