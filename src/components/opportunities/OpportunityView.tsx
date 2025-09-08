'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails, MEDDPICCData } from '@/lib/api/opportunities'
import Link from 'next/link'
import PEAKForm from '@/components/forms/PEAKForm'
import MEDDPICCForm from '@/components/forms/MEDDPICCForm'

interface OpportunityViewProps {
  opportunityId: string
}

type TabType = 'overview' | 'peak' | 'meddpicc' | 'activities' | 'contacts' | 'analytics'

export default function OpportunityView({ opportunityId }: OpportunityViewProps) {
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadOpportunity()
  }, [opportunityId])

  const loadOpportunity = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to load opportunity')
      } else {
        setOpportunity(data)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePEAKSave = async (data: any) => {
    if (!opportunity) return
    
    setSaving(true)
    try {
      console.log('Saving PEAK data:', data)
      const { data: updatedOpportunity, error } = await opportunityAPI.updateOpportunity(opportunity.id, {
        peak_stage: data.peak_stage,
        deal_value: data.deal_value,
        probability: data.probability,
        close_date: data.close_date
      })
      
      if (error) {
        console.error('Error saving PEAK data:', error)
        setError(error.message || 'Failed to save PEAK data')
        setSuccessMessage(null)
      } else {
        console.log('PEAK data saved successfully:', updatedOpportunity)
        setSuccessMessage('PEAK data saved successfully!')
        setError(null)
        await loadOpportunity()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Error saving PEAK data:', err)
      setError('An unexpected error occurred while saving PEAK data')
    } finally {
      setSaving(false)
    }
  }

  const handleMEDDPICCSave = async (data: MEDDPICCData) => {
    if (!opportunity) return
    
    setSaving(true)
    try {
      console.log('Saving MEDDPICC data:', data)
      const { data: updatedOpportunity, error } = await opportunityAPI.updateMEDDPICC(opportunity.id, data)
      
      if (error) {
        console.error('Error saving MEDDPICC data:', error)
        setError(error.message || 'Failed to save MEDDPICC data')
        setSuccessMessage(null)
      } else {
        console.log('MEDDPICC data saved successfully:', updatedOpportunity)
        setSuccessMessage('MEDDPICC data saved successfully!')
        setError(null)
        await loadOpportunity()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Error saving MEDDPICC data:', err)
      setError('An unexpected error occurred while saving MEDDPICC data')
    } finally {
      setSaving(false)
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-blue-100 text-blue-800'
      case 'engaging': return 'bg-yellow-100 text-yellow-800'
      case 'advancing': return 'bg-orange-100 text-orange-800'
      case 'key_decision': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'Prospecting'
      case 'engaging': return 'Engaging'
      case 'advancing': return 'Advancing'
      case 'key_decision': return 'Key Decision'
      default: return stage
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateDealHealth = () => {
    if (!opportunity) return 0
    const meddpiccScore = opportunity.meddpicc_score || 0
    const probability = opportunity.probability || 0
    return Math.round((meddpiccScore + probability) / 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4">
          <Link
            href="/opportunities"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Opportunity not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The opportunity you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'peak', label: 'PEAK', icon: '🎯' },
    { id: 'meddpicc', label: 'MEDDPICC', icon: '📋' },
    { id: 'activities', label: 'Activities', icon: '📝' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ]

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/opportunities"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
        <Link
          href={`/opportunities/${opportunity.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Link>
      </div>

      {/* Title and Tags */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{opportunity.name}</h1>
        <div className="mt-2 flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(opportunity.peak_stage)}`}>
            {getStageLabel(opportunity.peak_stage)}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            medium
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {opportunity.company?.name || 'No company assigned'}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Not specified • Created {formatDate(opportunity.created_at)}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 text-lg">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Deal Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(opportunity.deal_value)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Win Probability</dt>
                  <dd className="text-lg font-medium text-gray-900">{opportunity.probability || 0}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Deal Health</dt>
                  <dd className="text-lg font-medium text-gray-900">{calculateDealHealth()}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expected Close</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatDate(opportunity.close_date)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Opportunity Details */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Opportunity Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Stage</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(opportunity.peak_stage)}`}>
                            {getStageLabel(opportunity.peak_stage)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Source</span>
                        <div className="mt-1 text-sm text-gray-900">Not Specified</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Priority</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            medium
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Industry</span>
                        <div className="mt-1 text-sm text-gray-900">{opportunity.company?.industry || 'Not Specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Contact */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Primary Contact</h3>
                {opportunity.contact ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {opportunity.contact.first_name[0]}{opportunity.contact.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {opportunity.contact.first_name} {opportunity.contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{opportunity.contact.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No primary contact assigned</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Add Contact</button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activities</h3>
                <div className="mt-4 text-center py-4">
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'peak' && (
          <PEAKForm
            initialData={{
              peak_stage: opportunity.peak_stage as any,
              deal_value: opportunity.deal_value,
              probability: opportunity.probability,
              close_date: opportunity.close_date
            }}
            onSave={handlePEAKSave}
            loading={saving}
            onSuccess={() => loadOpportunity()}
          />
        )}

        {activeTab === 'meddpicc' && (
          <MEDDPICCForm
            initialData={{
              metrics: opportunity.metrics,
              economic_buyer: opportunity.economic_buyer,
              decision_criteria: opportunity.decision_criteria,
              decision_process: opportunity.decision_process,
              paper_process: opportunity.paper_process,
              identify_pain: opportunity.identify_pain,
              champion: opportunity.champion,
              competition: opportunity.competition
            }}
            onSave={handleMEDDPICCSave}
            loading={saving}
            onSuccess={() => {
              console.log('MEDDPICC form success callback triggered')
              loadOpportunity()
            }}
          />
        )}

        {activeTab === 'activities' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Activities</h3>
              <div className="mt-4 text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new activity.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Contacts</h3>
              <div className="mt-4 text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding contacts to this opportunity.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Analytics</h3>
              <div className="mt-4 text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">Analytics will appear here as you track activities and progress.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}