'use client'
import { useState, useEffect } from 'react'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<{
    nodeEnv: string
    vercel: string
    nextPhase: string
    supabaseUrl: string
    supabaseAnonKey: string
    isConfigured: boolean
    buildTime: boolean
  }>({
    nodeEnv: '',
    vercel: '',
    nextPhase: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    isConfigured: false,
    buildTime: false
  })

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
    
    const isConfigured = !isBuildTime && supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here' &&
      supabaseUrl !== 'https://your-project.supabase.co' &&
      supabaseAnonKey !== 'your_anon_key_here' &&
      supabaseUrl !== 'https://dummy.supabase.co' &&
      supabaseAnonKey !== 'dummy_anon_key_for_build'

    setEnvInfo({
      nodeEnv: process.env.NODE_ENV || 'undefined',
      vercel: process.env.VERCEL || 'undefined',
      nextPhase: process.env.NEXT_PHASE || 'undefined',
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
      supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
      isConfigured,
      buildTime: isBuildTime
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Environment Variables Debug</h1>
        
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div><strong>NODE_ENV:</strong> {envInfo.nodeEnv}</div>
              <div><strong>VERCEL:</strong> {envInfo.vercel}</div>
              <div><strong>NEXT_PHASE:</strong> {envInfo.nextPhase}</div>
              <div><strong>Is Build Time:</strong> {envInfo.buildTime ? 'Yes' : 'No'}</div>
            </div>
            
            <div className="space-y-2">
              <div><strong>Supabase URL:</strong> {envInfo.supabaseUrl}</div>
              <div><strong>Supabase Anon Key:</strong> {envInfo.supabaseAnonKey}</div>
              <div><strong>Is Configured:</strong> {envInfo.isConfigured ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Configuration Status:</h3>
            {envInfo.isConfigured ? (
              <div className="text-green-600">✅ Supabase is properly configured</div>
            ) : (
              <div className="text-red-600">
                ❌ Supabase is not configured. This could be due to:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Missing environment variables in Vercel</li>
                  <li>Environment variables not properly set</li>
                  <li>Build-time detection issue</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Note:</strong> This page shows partial values for security. Full values are not displayed.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
