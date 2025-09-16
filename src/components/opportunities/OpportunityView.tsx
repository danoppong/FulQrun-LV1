'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface OpportunityViewProps {
  opportunityId: string
}

export default function OpportunityView({ opportunityId }: OpportunityViewProps) {
  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchOpportunity = async () => {
    try {
      setLoading(true)
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to fetch opportunity')
      } else {
        setOpportunity(data)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error fetching opportunity:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunity()
  }, [opportunityId])

  // Refresh data when returning from edit mode
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when window regains focus (e.g., returning from edit page)
      fetchOpportunity()
    }

    const handleMeddpiccUpdate = (event: CustomEvent) => {
      // Refresh data when MEDDPICC is updated
      if (event.detail.opportunityId === opportunityId) {
        fetchOpportunity()
      }
    }

    const handlePeakUpdate = (event: CustomEvent) => {
      // Refresh data when PEAK is updated
      if (event.detail.opportunityId === opportunityId) {
        fetchOpportunity()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('meddpiccUpdated', handleMeddpiccUpdate as EventListener)
    window.addEventListener('peakUpdated', handlePeakUpdate as EventListener)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('meddpiccUpdated', handleMeddpiccUpdate as EventListener)
      window.removeEventListener('peakUpdated', handlePeakUpdate as EventListener)
    }
  }, [opportunityId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Opportunity not found</h3>
        <p className="text-gray-500">The requested opportunity could not be found.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary context="OpportunityView">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{opportunity.name}</h1>
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                  Stage: {opportunity.peak_stage}
                </span>
                {opportunity.deal_value && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    Value: ${opportunity.deal_value.toLocaleString()}
                  </span>
                )}
                {opportunity.probability && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Probability: {opportunity.probability}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/opportunities/${opportunityId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Edit
              </button>
              <button
                onClick={fetchOpportunity}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Company Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact & Company</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunity.contact && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Contact</h4>
                    <p className="text-sm text-gray-900">
                      {opportunity.contact.first_name} {opportunity.contact.last_name}
                    </p>
                    {opportunity.contact.email && (
                      <p className="text-sm text-gray-500">{opportunity.contact.email}</p>
                    )}
                    {opportunity.contact.title && (
                      <p className="text-sm text-gray-500">{opportunity.contact.title}</p>
                    )}
                  </div>
                )}
                {opportunity.company && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Company</h4>
                    <p className="text-sm text-gray-900">{opportunity.company.name}</p>
                    {opportunity.company.industry && (
                      <p className="text-sm text-gray-500">{opportunity.company.industry}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* MEDDPICC Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">MEDDPICC Qualification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunity.metrics && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Metrics</h4>
                    <p className="text-sm text-gray-900">{opportunity.metrics}</p>
                  </div>
                )}
                {opportunity.economic_buyer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Economic Buyer</h4>
                    <p className="text-sm text-gray-900">{opportunity.economic_buyer}</p>
                  </div>
                )}
                {opportunity.decision_criteria && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Decision Criteria</h4>
                    <p className="text-sm text-gray-900">{opportunity.decision_criteria}</p>
                  </div>
                )}
                {opportunity.decision_process && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Decision Process</h4>
                    <p className="text-sm text-gray-900">{opportunity.decision_process}</p>
                  </div>
                )}
                {opportunity.paper_process && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Paper Process</h4>
                    <p className="text-sm text-gray-900">{opportunity.paper_process}</p>
                  </div>
                )}
                {opportunity.identify_pain && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Identify Pain</h4>
                    <p className="text-sm text-gray-900">{opportunity.identify_pain}</p>
                  </div>
                )}
                {opportunity.champion && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Champion</h4>
                    <p className="text-sm text-gray-900">{opportunity.champion}</p>
                  </div>
                )}
                {opportunity.competition && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Competition</h4>
                    <p className="text-sm text-gray-900">{opportunity.competition}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">MEDDPICC Score</span>
                    <span className="font-medium">{opportunity.meddpicc_score}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${opportunity.meddpicc_score}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">AI Risk Score</span>
                    <span className="font-medium">{opportunity.ai_risk_score}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${opportunity.ai_risk_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {opportunity.ai_next_action && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Next Action</h4>
                    <p className="text-sm text-gray-900">{opportunity.ai_next_action}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {new Date(opportunity.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">
                    {new Date(opportunity.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {opportunity.close_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Close Date</span>
                    <span className="text-gray-900">
                      {new Date(opportunity.close_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
