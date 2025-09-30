/**
 * Legacy Supabase Client Export
 * 
 * This file now re-exports the global singleton to prevent multiple GoTrueClient instances.
 * All imports from this file will use the same singleton instance.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'

// Export the singleton instance
export const supabase = getSupabaseBrowserClient()

// Helper function for server-side client creation (delegates to browser client for now)
export function createServerClient() {
  return getSupabaseBrowserClient()
}

// Export a flag to check if Supabase is properly configured
import { supabaseConfig } from '@/lib/config'
export const isSupabaseConfigured = supabaseConfig.isConfigured
