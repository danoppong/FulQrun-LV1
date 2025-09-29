// Centralized configuration check for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
// Environment variables should be available in both build and runtime
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your_anon_key_here' &&
  supabaseUrl !== 'https://dummy.supabase.co' &&
  supabaseAnonKey !== 'dummy_anon_key_for_build'

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: isSupabaseConfigured
}

// Default organization ID for development (valid UUID format)
export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001'
