'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper'

export default function AIInsightsPage() {
  return (
    <AuthWrapper>
      <AIInsightsContent />
    </AuthWrapper>
  )
}

function AIInsightsContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      } catch (error) {
        console.error('Error loading user:', error)
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
          <p className="mt-4 text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-2 text-gray-600">
            AI-powered insights and recommendations for your sales performance
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Lead Scoring */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Lead Scoring</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              AI-powered lead scoring based on engagement, demographics, and behavior patterns.
            </p>
            <div className="text-2xl font-bold text-blue-600">85%</div>
            <div className="text-sm text-gray-500">Average accuracy</div>
          </div>

          {/* Deal Risk Assessment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Deal Risk</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Predictive risk assessment for deals based on historical data and patterns.
            </p>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-sm text-gray-500">High-risk deals</div>
          </div>

          {/* Next Best Action */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Next Actions</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              AI-recommended next actions to move deals forward and improve outcomes.
            </p>
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-500">Recommended actions</div>
          </div>
        </div>

        {/* Recent Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">Lead Scoring Update</p>
                <p className="text-sm text-blue-700">Lead "Acme Corp" has increased score by 15 points due to recent website engagement.</p>
                <p className="text-xs text-blue-600 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-red-900">Deal Risk Alert</p>
                <p className="text-sm text-red-700">Deal "Enterprise Software" shows 75% risk of stalling. Recommend immediate follow-up.</p>
                <p className="text-xs text-red-600 mt-1">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-green-900">Action Recommendation</p>
                <p className="text-sm text-green-700">Schedule demo for "Tech Solutions" - high probability of conversion based on engagement patterns.</p>
                <p className="text-xs text-green-600 mt-1">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Lead Scoring Model</h3>
              <p className="text-sm text-gray-600 mb-3">Configure how leads are scored based on various factors.</p>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                Configure Model
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Risk Assessment</h3>
              <p className="text-sm text-gray-600 mb-3">Set up risk factors and thresholds for deal assessment.</p>
              <button className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                Configure Risk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
