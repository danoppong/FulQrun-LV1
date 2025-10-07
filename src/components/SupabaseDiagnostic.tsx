'use client'
import React from 'react';

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth';
import { supabaseConfig } from '@/lib/config';

export default function SupabaseDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<{
    configStatus: string
    connectionStatus: string
    authStatus: string
    error?: string
  }>({
    configStatus: 'Checking...',
    connectionStatus: 'Checking...',
    authStatus: 'Checking...'
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      const results = {
        configStatus: '',
        connectionStatus: '',
        authStatus: '',
        error: undefined as string | undefined
      }

      try {
        // Check configuration
        if (supabaseConfig.isConfigured) {
          results.configStatus = '✅ Supabase is configured'
        } else {
          results.configStatus = '❌ Supabase is not configured'
          results.error = 'Missing environment variables'
          setDiagnostics(results)
          return
        }

        // Test connection
        try {
          const supabase = createClientComponentClient()
          const { data: _data, error } = await supabase.from('organizations').select('count').limit(1)
          
          if (error) {
            results.connectionStatus = `❌ Connection failed: ${error.message}`
            results.error = error.message
          } else {
            results.connectionStatus = '✅ Database connection successful'
          }
        } catch (err) {
          results.connectionStatus = `❌ Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
          results.error = err instanceof Error ? err.message : 'Unknown error'
        }

        // Test auth
        try {
          const supabase = createClientComponentClient()
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) {
            results.authStatus = `❌ Auth error: ${error.message}`
          } else if (user) {
            results.authStatus = `✅ User authenticated: ${user.email}`
          } else {
            results.authStatus = 'ℹ️ No user logged in'
          }
        } catch (err) {
          results.authStatus = `❌ Auth error: ${err instanceof Error ? err.message : 'Unknown error'}`
        }

      } catch (err) {
        results.error = err instanceof Error ? err.message : 'Unknown error'
      }

      setDiagnostics(results)
    }

    runDiagnostics()
  }, [])

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Supabase Diagnostic</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Configuration:</strong> {diagnostics.configStatus}
        </div>
        <div>
          <strong>Connection:</strong> {diagnostics.connectionStatus}
        </div>
        <div>
          <strong>Authentication:</strong> {diagnostics.authStatus}
        </div>
        
        {diagnostics.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <strong>Error:</strong> {diagnostics.error}
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <strong>Configuration Details:</strong>
          <br />
          URL: {supabaseConfig.url ? '✅ Set' : '❌ Missing'}
          <br />
          Anon Key: {supabaseConfig.anonKey ? '✅ Set' : '❌ Missing'}
        </div>
      </div>
    </div>
  )
}
