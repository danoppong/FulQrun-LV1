'use client'

import { SalesPerformanceDashboard } from '@/components/sales-performance/SalesPerformanceDashboard'
import { AuthWrapper } from '@/components/auth/AuthWrapper'

export default function SalesPerformancePage() {
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
          
          <SalesPerformanceDashboard />
        </div>
      </div>
    </AuthWrapper>
  )
}