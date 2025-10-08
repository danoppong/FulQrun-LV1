'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'

// API imports
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'

// Type imports
import { useErrorHandler } from '@/lib/utils/error-handling'

// Dynamic imports for performance
const MEDDPICCQualification = dynamic(() => import('@/components/meddpicc/MEDDPICCQualification'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>,
  ssr: false
})

// Validation schema
const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

// PEAK stages
const PEAK_STAGES = [
  { id: 'prospecting', name: 'Prospecting', description: 'Initial research and prospecting phase' },
  { id: 'engaging', name: 'Engaging', description: 'Active engagement with prospects' },
  { id: 'advancing', name: 'Advancing', description: 'Moving the opportunity forward' },
  { id: 'key_decision', name: 'Key Decision', description: 'Final decision-making phase' }
] as const

type PEAKStage = typeof PEAK_STAGES[number]['id']

interface PEAKData {
  peak_stage: PEAKStage
  deal_value?: number
  probability?: number
  close_date?: string
}

interface MEDDPICCData {
  metrics: string
  economic_buyer: string
  decision_criteria: string
  decision_process: string
  paper_process: string
  identify_pain: string
  implicate_pain: string
  champion: string
  competition: string
}

interface OpportunityFormProps {
  opportunity?: OpportunityWithDetails
  opportunityId?: string
  mode: 'create' | 'edit'
}

export default function OpportunityForm({ opportunity, opportunityId, mode }: OpportunityFormProps) {
  const router = useRouter()
  const { handleAsyncOperation } = useErrorHandler()

  // Core form state
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Separate state for each section - NO AUTO-SAVE
  const opportunityData = opportunity as unknown as Record<string, string | number | null | undefined>
  
  const [peakData, setPeakData] = useState<PEAKData>({
    peak_stage: (opportunityData?.peak_stage as PEAKStage) || 'prospecting',
    deal_value: (opportunityData?.deal_value as number) || undefined,
    probability: (opportunityData?.probability as number) || undefined,
    close_date: (opportunityData?.close_date as string) || ''
  })

  const [meddpiccData, setMeddpiccData] = useState<MEDDPICCData>({
    metrics: (opportunityData?.metrics as string) || '',
    economic_buyer: (opportunityData?.economic_buyer as string) || '',
    decision_criteria: (opportunityData?.decision_criteria as string) || '',
    decision_process: (opportunityData?.decision_process as string) || '',
    paper_process: (opportunityData?.paper_process as string) || '',
    identify_pain: (opportunityData?.identify_pain as string) || '',
    implicate_pain: (opportunityData?.implicate_pain as string) || '',
    champion: (opportunityData?.champion as string) || '',
    competition: (opportunityData?.competition as string) || ''
  })

  // Form setup - Cast to proper type for form compatibility
  const opportunityRecord = opportunity as unknown as Record<string, unknown>
  const formDefaults = opportunity ? {
    name: (opportunityRecord.name as string) || '',
    contact_id: (opportunityRecord.contact_id as string) || '',
    company_id: (opportunityRecord.company_id as string) || '',
  } : {
    name: '',
    contact_id: '',
    company_id: '',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: formDefaults
  })

  // Load supporting data
  const loadContacts = useCallback(async () => {
    try {
      const { data, error } = await contactAPI.getContacts()
      if (!error && data) {
        setContacts(data)
      }
    } catch (_err) {
      console.warn('Failed to load contacts:', _err)
    }
  }, [])

  const loadCompanies = useCallback(async () => {
    try {
      const { data, error } = await companyAPI.getCompanies()
      if (!error && data) {
        setCompanies(data)
      }
    } catch (_err) {
      console.warn('Failed to load companies:', _err)
    }
  }, [])

  const loadOpportunity = useCallback(async () => {
    if (!opportunityId) return
    
    try {
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error || !data) {
        setError('Failed to load opportunity')
        return
      }

      // Update form data
      const resetDataRecord = data as unknown as Record<string, unknown>
      reset({
        name: resetDataRecord.name as string,
        contact_id: (resetDataRecord.contact_id as string) || '',
        company_id: (resetDataRecord.company_id as string) || ''
      })

      // Update PEAK data
      const dataRecord = data as unknown as Record<string, unknown>
      setPeakData({
        peak_stage: (dataRecord.peak_stage as PEAKStage) || 'prospecting',
        deal_value: (dataRecord.deal_value as number) || undefined,
        probability: (dataRecord.probability as number) || undefined,
        close_date: (dataRecord.close_date as string) || ''
      })

      // Update MEDDPICC data
      setMeddpiccData({
        metrics: (dataRecord.metrics as string) || '',
        economic_buyer: (dataRecord.economic_buyer as string) || '',
        decision_criteria: (dataRecord.decision_criteria as string) || '',
        decision_process: (dataRecord.decision_process as string) || '',
        paper_process: (dataRecord.paper_process as string) || '',
        identify_pain: (dataRecord.identify_pain as string) || '',
        implicate_pain: (dataRecord.implicate_pain as string) || '',
        champion: (dataRecord.champion as string) || '',
        competition: (dataRecord.competition as string) || ''
      })

    } catch (_err) {
      setError('Failed to load opportunity')
    }
  }, [opportunityId, reset])

  // Load data on mount
  useEffect(() => {
    loadContacts()
    loadCompanies()
    if (mode === 'edit' && opportunityId) {
      loadOpportunity()
    }
  }, [loadContacts, loadCompanies, loadOpportunity, mode, opportunityId])

  // Manual save functions - NO AUTO-SAVE
  const savePeakData = useCallback(async () => {
    if (!opportunityId) return
    
    setLoading(true)
    try {
      const { error } = await opportunityAPI.updateOpportunity(opportunityId, peakData)
      if (error) {
        setError('Failed to save PEAK data')
      } else {
        setLastSaved(new Date())
        setSuccessMessage('PEAK data saved successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (_err) {
      setError('Failed to save PEAK data')
    } finally {
      setLoading(false)
    }
  }, [opportunityId, peakData])

  const saveMeddpiccData = useCallback(async () => {
    if (!opportunityId) return
    
    setLoading(true)
    try {
      const { error } = await opportunityAPI.updateMEDDPICC(opportunityId, meddpiccData)
      if (error) {
        setError('Failed to save MEDDPICC data')
      } else {
        setLastSaved(new Date())
        setSuccessMessage('MEDDPICC data saved successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (_err) {
      setError('Failed to save MEDDPICC data')
    } finally {
      setLoading(false)
    }
  }, [opportunityId, meddpiccData])

  // Main form submission
  const onSubmit = async (data: OpportunityFormData) => {
    const _result = await handleAsyncOperation(
      async () => {
        // Combine all data for submission
        const opportunityData = {
          name: data.name,
          contact_id: data.contact_id || null,
          company_id: data.company_id || null,
          // PEAK data
          ...peakData,
          // MEDDPICC data
          ...meddpiccData
        }

        let result
        if (mode === 'create') {
          result = await opportunityAPI.createOpportunity(opportunityData)
        } else if (opportunityId) {
          result = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
        }

        if (result?.error) {
          throw new Error(result.error.message || 'Failed to save opportunity')
        }

        setLastSaved(new Date())
        
        if (mode === 'create') {
          router.push('/opportunities')
        } else {
          setSuccessMessage('Opportunity updated successfully!')
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        
        return result
      },
      setError,
      setLoading
    )
  }

  return (
    <div className="w-full max-w-none">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Opportunity' : 'Edit Opportunity'}
          </h1>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="px-6 py-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success Display */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Opportunity Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-3 touch-manipulation"
                  placeholder="e.g., Enterprise Software License"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                    Contact
                  </label>
                  <select
                    {...register('contact_id')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-3 touch-manipulation"
                  >
                    <option value="">Select a contact</option>
                    {contacts.map((contact) => {
                      const contactRecord = contact as unknown as Record<string, unknown>
                      const companyRecord = contactRecord.company as Record<string, unknown> | undefined
                      return (
                        <option key={contactRecord.id as string} value={contactRecord.id as string}>
                          {contactRecord.first_name as string} {contactRecord.last_name as string}
                          {companyRecord && ` (${companyRecord.name as string})`}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <select
                    {...register('company_id')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-3 touch-manipulation"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => {
                      const companyRecord = company as unknown as Record<string, unknown>
                      return (
                        <option key={companyRecord.id as string} value={companyRecord.id as string}>
                          {companyRecord.name as string}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* PEAK Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">PEAK Stage Management</h2>
                {mode === 'edit' && opportunityId && (
                  <button
                    type="button"
                    onClick={savePeakData}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save PEAK'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {PEAK_STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      peakData.peak_stage === stage.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setPeakData(prev => ({ ...prev, peak_stage: stage.id }))}
                  >
                    <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deal Value ($)
                  </label>
                  <input
                    type="number"
                    value={peakData.deal_value || ''}
                    onChange={(e) => setPeakData(prev => ({ 
                      ...prev, 
                      deal_value: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Probability (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={peakData.probability || ''}
                    onChange={(e) => setPeakData(prev => ({ 
                      ...prev, 
                      probability: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Close Date
                  </label>
                  <input
                    type="date"
                    value={peakData.close_date || ''}
                    onChange={(e) => setPeakData(prev => ({ ...prev, close_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* MEDDPICC Section */}
            {mode === 'edit' && opportunityId ? (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">MEDDPICC Qualification</h2>
                <MEDDPICCQualification
                  opportunityId={opportunityId}
                  onSave={(assessment) => {
                    console.log('MEDDPICC assessment saved:', assessment)
                    setLastSaved(new Date())
                    setSuccessMessage('MEDDPICC assessment saved successfully!')
                    setTimeout(() => setSuccessMessage(null), 3000)
                  }}
                  onStageGateReady={(isReady) => {
                    console.log('Stage gate ready:', isReady)
                  }}
                  className=""
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">MEDDPICC Qualification</h2>
                  {mode === 'edit' && opportunityId && (
                    <button
                      type="button"
                      onClick={saveMeddpiccData}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save MEDDPICC'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metrics
                    </label>
                    <textarea
                      value={meddpiccData.metrics}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, metrics: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Quantifiable business impact..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Economic Buyer
                    </label>
                    <textarea
                      value={meddpiccData.economic_buyer}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, economic_buyer: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Who has budget authority..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Decision Criteria
                    </label>
                    <textarea
                      value={meddpiccData.decision_criteria}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, decision_criteria: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="How they will decide..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Decision Process
                    </label>
                    <textarea
                      value={meddpiccData.decision_process}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, decision_process: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Steps in their process..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Paper Process
                    </label>
                    <textarea
                      value={meddpiccData.paper_process}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, paper_process: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Legal and procurement steps..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Identify Pain
                    </label>
                    <textarea
                      value={meddpiccData.identify_pain}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, identify_pain: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Current problems they face..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Implicate Pain
                    </label>
                    <textarea
                      value={meddpiccData.implicate_pain}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, implicate_pain: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Cost of inaction..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Champion
                    </label>
                    <textarea
                      value={meddpiccData.champion}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, champion: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Internal advocate..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Competition
                    </label>
                    <textarea
                      value={meddpiccData.competition}
                      onChange={(e) => setMeddpiccData(prev => ({ ...prev, competition: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Competitive landscape..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/opportunities')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {mode === 'edit' && opportunityId && (
                <button
                  type="button"
                  onClick={() => router.push(`/opportunities/${opportunityId}`)}
                  className="bg-white py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  Back to View
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Opportunity' : 'Update Opportunity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}