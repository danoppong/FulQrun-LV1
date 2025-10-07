'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/auth-unified'
import { SalesPerformanceDashboard } from '@/components/sales-performance/SalesPerformanceDashboard'
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function SalesPerformancePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthWrapper allowedRoles={['rep', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sales Performance</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive sales performance management, quota tracking, and compensation planning
            </p>
          </div>
          
          <SalesPerformanceDashboard user={user} />
        </div>
      </div>
    </AuthWrapper>
  )
}
