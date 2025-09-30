/**
 * Client-Side Supabase Client Export
 * 
 * This file exports only client-side Supabase functionality.
 * For server-side functionality, use '@/lib/supabase-server' instead.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'
import { supabaseConfig } from '@/lib/config'

// Export the singleton instance for browser use
export const supabase = getSupabaseBrowserClient()

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = supabaseConfig.isConfigured
