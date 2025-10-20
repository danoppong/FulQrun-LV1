'use client'

import { useState } from 'react'

export default function MigrateUsersRegionCountryPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<string[]>([])

  const runMigration = async () => {
    try {
      setStatus('running')
      setMessage('Running migration...')
      setDetails([])

      const response = await fetch('/api/admin/migrate-users-region-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(result.message || 'Migration completed successfully')
        setDetails(result.changes || [])
      } else {
        setStatus('error')
        setMessage(result.error || 'Migration failed')
        setDetails(result.details ? [result.details] : [])
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to run migration')
      setDetails([error instanceof Error ? error.message : String(error)])
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Migrate Users: Add Region & Country Columns</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Migration Details</h2>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Adds <code className="bg-gray-100 px-1 rounded">region</code> column to users table</li>
            <li>Adds <code className="bg-gray-100 px-1 rounded">country</code> column to users table</li>
            <li>Creates performance indexes for region/country filtering</li>
            <li>Migrates existing data from user_profiles table</li>
          </ul>
        </div>

        <button
          onClick={runMigration}
          disabled={status === 'running'}
          className={`px-4 py-2 rounded font-medium ${
            status === 'running'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : status === 'success'
              ? 'bg-green-600 text-white'
              : status === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {status === 'running' ? 'Running Migration...' : 
           status === 'success' ? 'Migration Completed' :
           status === 'error' ? 'Migration Failed - Retry' :
           'Run Migration'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded ${
            status === 'success' ? 'bg-green-50 text-green-800' :
            status === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <p className="font-medium">{message}</p>
            {details.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}