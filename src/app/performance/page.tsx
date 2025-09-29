'use client'

import React, { useState, useEffect } from 'react'
import { CSTPVDashboard } from '@/components/performance/CSTPVDashboard'
import { createClientComponentClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/config'

export default function PerformancePage() {
  return (
    <AuthWrapper>
      <PerformanceContent />
    </AuthWrapper>
  )
}

function PerformanceContent() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last_month' | 'last_quarter' | 'last_year' | 'custom'>('current')
  const [customPeriod, setCustomPeriod] = useState<{
    start: string
    end: string
  } | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
      } catch (_error) {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    )
  }

  const getPeriodDates = () => {
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'current':
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          start: currentStart.toISOString().split('T')[0],
          end: currentEnd.toISOString().split('T')[0]
        }
      
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: lastMonthStart.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0]
        }
      
      case 'last_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        const lastQuarter = quarter === 0 ? 3 : quarter - 1
        const lastQuarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1)
        const lastQuarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
        return {
          start: lastQuarterStart.toISOString().split('T')[0],
          end: lastQuarterEnd.toISOString().split('T')[0]
        }
      
      case 'last_year':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
        return {
          start: lastYearStart.toISOString().split('T')[0],
          end: lastYearEnd.toISOString().split('T')[0]
        }
      
      default:
        return customPeriod || {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        }
    }
  }

  const handleCustomPeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const start = formData.get('start') as string
    const end = formData.get('end') as string
    
    if (start && end) {
      setCustomPeriod({ start, end })
      setSelectedPeriod('custom')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to view performance metrics.</p>
        </div>
      </div>
    )
  }

  const periodDates = getPeriodDates()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="mt-2 text-gray-600">
            Track and analyze your sales performance using the CSTPV framework
          </p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Performance Period</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'current' | 'last_month' | 'last_quarter' | 'last_year' | 'custom')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="current">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
          </div>

          {selectedPeriod === 'custom' && (
            <form onSubmit={handleCustomPeriodSubmit} className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="start"
                  defaultValue={customPeriod?.start || ''}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="end"
                  defaultValue={customPeriod?.end || ''}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </form>
          )}

          <div className="text-sm text-gray-500">
            Showing performance data from {new Date(periodDates.start).toLocaleDateString()} to {new Date(periodDates.end).toLocaleDateString()}
          </div>
        </div>

        {/* CSTPV Dashboard */}
        <CSTPVDashboard
          userId={user.id}
          organizationId={user.profile?.organization_id || DEFAULT_ORGANIZATION_ID}
          periodStart={periodDates.start}
          periodEnd={periodDates.end}
        />

        {/* Performance Insights */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">CSTPV Framework</h3>
              <p className="text-sm text-blue-700">
                The CSTPV framework measures five key areas of sales performance: 
                CLARITY, SCORE, TEACH, PROBLEM, and VALUE.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">Performance Tracking</h3>
              <p className="text-sm text-green-700">
                Monitor your progress across all CSTPV dimensions to identify 
                strengths and areas for improvement.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Continuous Improvement</h3>
              <p className="text-sm text-purple-700">
                Use performance data to set goals, track progress, and implement 
                targeted improvement strategies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
