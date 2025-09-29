import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const envInfo = {
    nodeEnv: process.env.NODE_ENV || 'undefined',
    vercel: process.env.VERCEL || 'undefined',
    nextPhase: process.env.NEXT_PHASE || 'undefined',
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
    isConfigured: supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here' &&
      supabaseUrl !== 'https://your-project.supabase.co' &&
      supabaseAnonKey !== 'your_anon_key_here' &&
      supabaseUrl !== 'https://dummy.supabase.co' &&
      supabaseAnonKey !== 'dummy_anon_key_for_build',
    buildTime: process.env.NEXT_PHASE === 'phase-production-build'
  }

  return NextResponse.json({
    message: 'Environment variables debug (server-side)',
    ...envInfo,
    timestamp: new Date().toISOString()
  })
}
