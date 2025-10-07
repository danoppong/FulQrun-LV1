'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/auth-unified';

export default function TestAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testAuth = async () => {
      try {
        console.log('Testing authentication...')
        const currentUser = await AuthService.getCurrentUser()
        console.log('Current user:', currentUser)
        setUser(currentUser)
      } catch (err) {
        console.error('Auth error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAuth()
  }, [])

  const testAPI = async () => {
    try {
      console.log('Testing API with auth...')
      const response = await fetch('/api/sales-performance/metric-templates')
      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Data:', data)
        alert(`Success! Found ${data.length} templates`)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`API Error: ${errorData.error}`)
      }
    } catch (err) {
      console.error('API Test error:', err)
      alert(`API Test Error: ${err.message}`)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Authentication Error:</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.href = '/auth/login'}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
      <h3 className="font-bold">Authentication Working!</h3>
      <p>User: {user?.email}</p>
      <p>Role: {user?.profile?.role}</p>
      <p>Organization ID: {user?.profile?.organization_id}</p>
      
      <button 
        onClick={testAPI}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test API Call
      </button>
    </div>
  )
}