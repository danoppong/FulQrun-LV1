'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails, OpportunityFormData, MEDDPICCData } from '@/lib/api/opportunities'

type PEAKData = {
  peak_stage: 'prospecting' | 'engaging' | 'advancing' | 'key_decision'
  deal_value?: number | undefined
  probability?: number | undefined
  close_date?: string | undefined
}
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PEAKForm from '@/components/forms/PEAKForm'
import MEDDPICCForm from '@/components/forms/MEDDPICCForm'
import { MEDDPICCDashboard, MEDDPICCPEAKIntegration } from '@/components/meddpicc'
import { MEDDPICCAssessment } from '@/lib/meddpicc'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
})

type LocalOpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormEnhancedProps {
  opportunity?: OpportunityWithDetails | null
  opportunityId?: string
  mode: 'create' | 'edit'
}

export default function OpportunityFormEnhanced({ 
  opportunity, 
  opportunityId, 
  mode 
}: OpportunityFormEnhancedProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // PEAK data state
  const [peakData, setPeakData] = useState<PEAKData>({
    peak_stage: opportunity?.peak_stage || 'prospecting',
    deal_value: opportunity?.deal_value || undefined,
    probability: opportunity?.probability || undefined,
    close_date: opportunity?.close_date || ''
  })
  
  // MEDDPICC data state
  const [meddpiccData, setMeddpiccData] = useState<MEDDPICCData>({
    metrics: opportunity?.metrics || '',
    economic_buyer: opportunity?.economic_buyer || '',
    decision_criteria: opportunity?.decision_criteria || '',
    decision_process: opportunity?.decision_process || '',
    paper_process: opportunity?.paper_process || '',
    identify_pain: opportunity?.identify_pain || '',
    champion: opportunity?.champion || '',
    competition: opportunity?.competition || ''
  })
  
  const [showComprehensiveMEDDPICC, setShowComprehensiveMEDDPICC] = useState(false)
  const [meddpiccAssessment, setMeddpiccAssessment] = useState<MEDDPICCAssessment | undefined>(undefined)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm<LocalOpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity ? {
      name: opportunity.name,
      contact_id: opportunity.contact_id || '',
      company_id: opportunity.company_id || '',
      description: opportunity.description || '',
      assigned_to: opportunity.assigned_to || ''
    } : {
      name: '',
      contact_id: '',
      company_id: '',
      description: '',
      assigned_to: ''
    }
  })

  const watchedValues = watch()

  // Track form changes
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change') {
        setIsDirty(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  // Load initial data
  useEffect(() => {
    loadContacts()
    loadCompanies()
    if (mode === 'edit' && opportunityId && !opportunity) {
      loadOpportunity()
    }
  }, [mode, opportunityId, opportunity])

  // Auto-save functionality (every 30 seconds if dirty)
  useEffect(() => {
    if (isDirty && mode === 'edit' && opportunityId) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave()
      }, 30000) // 30 seconds

      return () => clearTimeout(autoSaveTimer)
    }
  }, [isDirty, mode, opportunityId])

  const loadOpportunity = async () => {
    if (!opportunityId) return
    
    try {
      setLoading(true)
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to load opportunity')
        return
      }

      if (data) {
        // Reset form with loaded data
        reset({
          name: data.name,
          contact_id: data.contact_id || '',
          company_id: data.company_id || '',
          description: data.description || '',
          assigned_to: data.assigned_to || ''
        })

        // Update PEAK data
        setPeakData({
          peak_stage: data.peak_stage || 'prospecting',
          deal_value: data.deal_value || undefined,
          probability: data.probability || undefined,
          close_date: data.close_date || ''
        })

        // Update MEDDPICC data
        setMeddpiccData({
          metrics: data.metrics || '',
          economic_buyer: data.economic_buyer || '',
          decision_criteria: data.decision_criteria || '',
          decision_process: data.decision_process || '',
          paper_process: data.paper_process || '',
          identify_pain: data.identify_pain || '',
          champion: data.champion || '',
          competition: data.competition || ''
        })

        setIsDirty(false)
      }
    } catch (err) {
      setError('An unexpected error occurred while loading the opportunity')
      console.error('Error loading opportunity:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const { data, error } = await contactAPI.getContacts()
      if (error) {
        console.error('Error loading contacts:', error)
      } else {
        setContacts(data || [])
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await companyAPI.getCompanies()
      if (error) {
        console.error('Error loading companies:', error)
      } else {
        setCompanies(data || [])
      }
    } catch (err) {
      console.error('Error loading companies:', err)
    }
  }

  const handleAutoSave = async () => {
    if (!opportunityId || !isDirty) return

    try {
      const formData = watchedValues
      const opportunityData: Partial<LocalOpportunityFormData> = {
        ...formData,
        ...peakData,
        ...meddpiccData
      }

      const { error } = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
      
      if (!error) {
        setLastSaved(new Date())
        setIsDirty(false)
        console.log('Auto-saved successfully')
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }

  const handlePeakSave = useCallback(async (data: PEAKData) => {
    setPeakData(data)
    setIsDirty(true)
  }, [])

  const handlePeakSuccess = useCallback(() => {
    console.log('PEAK data saved successfully')
  }, [])

  const handleMeddpiccSave = useCallback((data: MEDDPICCData) => {
    setMeddpiccData(data)
    setIsDirty(true)
  }, [])

  const handleMeddpiccSuccess = useCallback(() => {
    console.log('MEDDPICC data saved successfully')
  }, [])

  const onSubmit = async (data: LocalOpportunityFormData) => {
    setLoading(true)
    setError(null)
    setValidationErrors([])

    try {
      // Validate all data
      const validation = opportunityAPI['validateOpportunityData']({
        ...data,
        ...peakData,
        ...meddpiccData
      })

      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setLoading(false)
        return
      }

      const opportunityData: LocalOpportunityFormData = {
        ...data,
        ...peakData,
        ...meddpiccData
      }

      let result
      if (mode === 'create') {
        result = await opportunityAPI.createOpportunity(opportunityData)
      } else if (opportunityId) {
        result = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save opportunity')
        if (result.error.details) {
          setValidationErrors([result.error.details])
        }
      } else {
        setLastSaved(new Date())
        setIsDirty(false)
        router.push('/opportunities')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error saving opportunity:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setValue(field as any, value)
    setIsDirty(true)
  }

  if (loading && mode === 'edit' && !opportunity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading opportunity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header with save status */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create Opportunity' : 'Edit Opportunity'}
            </h1>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          {isDirty && (
            <div className="flex items-center text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Validation Errors</h3>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Opportunity Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter opportunity name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                  Contact
                </label>
                <select
                  {...register('contact_id')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <select
                  {...register('company_id')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter opportunity description"
                />
              </div>

              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                  Assigned To
                </label>
                <input
                  {...register('assigned_to')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter assigned user ID"
                />
              </div>
            </div>
          </div>

          {/* PEAK Stage Management */}
          <ErrorBoundary>
            <PEAKForm
              initialData={peakData}
              onSave={handlePeakSave}
              onSuccess={handlePeakSuccess}
              loading={loading}
            />
          </ErrorBoundary>

          {/* MEDDPICC Qualification */}
          <ErrorBoundary>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">MEDDPICC Qualification</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowComprehensiveMEDDPICC(!showComprehensiveMEDDPICC)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {showComprehensiveMEDDPICC ? 'Simple View' : 'Comprehensive View'}
                  </button>
                </div>
              </div>
              
              {showComprehensiveMEDDPICC ? (
                <div className="space-y-6">
                  {/* MEDDPICC Dashboard */}
                  <MEDDPICCDashboard
                    opportunityId={opportunityId || ''}
                    assessment={meddpiccAssessment}
                  />
                  
                  {/* PEAK Integration */}
                  <MEDDPICCPEAKIntegration
                    opportunityId={opportunityId || ''}
                    currentPEAKStage={peakData.peak_stage || 'prospecting'}
                    assessment={meddpiccAssessment}
                    onStageAdvance={async (fromStage, toStage) => {
                      try {
                        const { error } = await opportunityAPI.updatePeakStage(opportunityId!, toStage as any)
                        if (!error) {
                          setPeakData(prev => ({ ...prev, peak_stage: toStage as any }))
                          setIsDirty(true)
                        }
                      } catch (error) {
                        console.error('Error advancing stage:', error)
                      }
                    }}
                  />
                  
                  {/* Comprehensive MEDDPICC Form */}
                  <MEDDPICCForm
                    opportunityId={opportunityId}
                    initialData={{
                      metrics: meddpiccData.metrics || undefined,
                      economic_buyer: meddpiccData.economic_buyer || undefined,
                      decision_criteria: meddpiccData.decision_criteria || undefined,
                      decision_process: meddpiccData.decision_process || undefined,
                      paper_process: meddpiccData.paper_process || undefined,
                      identify_pain: meddpiccData.identify_pain || undefined,
                      implicate_pain: meddpiccData.implicate_pain || undefined,
                      champion: meddpiccData.champion || undefined,
                      competition: meddpiccData.competition || undefined
                    }}
                    onSave={handleMeddpiccSave}
                    onSuccess={handleMeddpiccSuccess}
                    loading={loading}
                    useComprehensiveView={true}
                  />
                </div>
              ) : (
                <MEDDPICCForm
                  initialData={{
                    metrics: meddpiccData.metrics || undefined,
                    economic_buyer: meddpiccData.economic_buyer || undefined,
                    decision_criteria: meddpiccData.decision_criteria || undefined,
                    decision_process: meddpiccData.decision_process || undefined,
                    paper_process: meddpiccData.paper_process || undefined,
                    identify_pain: meddpiccData.identify_pain || undefined,
                    implicate_pain: meddpiccData.implicate_pain || undefined,
                    champion: meddpiccData.champion || undefined,
                    competition: meddpiccData.competition || undefined
                  }}
                  onSave={handleMeddpiccSave}
                  onSuccess={handleMeddpiccSuccess}
                  loading={loading}
                />
              )}
            </div>
          </ErrorBoundary>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-background py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Opportunity' : 'Update Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
