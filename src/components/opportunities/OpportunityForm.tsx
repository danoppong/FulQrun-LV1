'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails, OpportunityFormData } from '@/lib/api/opportunities'
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components
const PEAKForm = dynamic(() => import('@/components/forms/PEAKForm'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ssr: false
})
const MEDDPICCForm = dynamic(() => import('@/components/forms/MEDDPICCForm'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ssr: false
})
const MEDDPICCDashboard = dynamic(() => import('@/components/meddpicc').then(mod => ({ default: mod.MEDDPICCDashboard })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ssr: false
})
const MEDDPICCPEAKIntegration = dynamic(() => import('@/components/meddpicc').then(mod => ({ default: mod.MEDDPICCPEAKIntegration })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ssr: false
})

import type { PEAKFormData } from '@/components/forms/PEAKForm'
import type { MEDDPICCFormData } from '@/components/forms/MEDDPICCForm'
import { MEDDPICCAssessment, calculateMEDDPICCScore } from '@/lib/meddpicc'
import { meddpiccScoringService } from '@/lib/services/meddpicc-scoring'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MEDDPICCErrorBoundary } from '@/components/error-boundaries/MEDDPICCErrorBoundary'
import { useErrorHandler } from '@/lib/utils/error-handling'

const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
})

type LocalOpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
  opportunity?: OpportunityWithDetails
  opportunityId?: string
  mode: 'create' | 'edit'
}

// PEAK stages moved to PEAKForm component

// Helper function to calculate MEDDPICC score from simple data format
const calculateMEDDPICCScoreFromData = (data: Record<string, string>): number => {
  try {
    // Convert simple data format to comprehensive format for scoring
    const responses = []
    
    if (data.metrics) {
      responses.push({
        pillarId: 'metrics',
        questionId: 'current_cost',
        answer: data.metrics,
        points: Math.min(10, Math.floor(data.metrics.length / 10))
      })
    }
    
    if (data.economic_buyer) {
      responses.push({
        pillarId: 'economicBuyer',
        questionId: 'budget_authority',
        answer: data.economic_buyer,
        points: Math.min(10, Math.floor(data.economic_buyer.length / 10))
      })
    }
    
    if (data.decision_criteria) {
      responses.push({
        pillarId: 'decisionCriteria',
        questionId: 'key_criteria',
        answer: data.decision_criteria,
        points: Math.min(10, Math.floor(data.decision_criteria.length / 10))
      })
    }
    
    if (data.decision_process) {
      responses.push({
        pillarId: 'decisionProcess',
        questionId: 'process_steps',
        answer: data.decision_process,
        points: Math.min(10, Math.floor(data.decision_process.length / 10))
      })
    }
    
    if (data.paper_process) {
      responses.push({
        pillarId: 'paperProcess',
        questionId: 'documentation',
        answer: data.paper_process,
        points: Math.min(10, Math.floor(data.paper_process.length / 10))
      })
    }
    
    if (data.identify_pain) {
      responses.push({
        pillarId: 'identifyPain',
        questionId: 'biggest_challenge',
        answer: data.identify_pain,
        points: Math.min(10, Math.floor(data.identify_pain.length / 10))
      })
    }
    
    if (data.champion) {
      responses.push({
        pillarId: 'champion',
        questionId: 'champion_identity',
        answer: data.champion,
        points: Math.min(10, Math.floor(data.champion.length / 10))
      })
    }
    
    if (data.competition) {
      responses.push({
        pillarId: 'competition',
        questionId: 'competitors',
        answer: data.competition,
        points: Math.min(10, Math.floor(data.competition.length / 10))
      })
    }
    
    // Calculate score using the comprehensive scoring function
    const assessment = calculateMEDDPICCScore(responses)
    return assessment.overallScore
  } catch (error) {
    console.error('Error calculating MEDDPICC score:', error)
    return 0
  }
}

export default function OpportunityForm({ opportunity, opportunityId, mode }: OpportunityFormProps) {
  const router = useRouter()
  const { handleError: _handleError, handleLoadingError: _handleLoadingError, handleAsyncOperation } = useErrorHandler()
  
  // Debug logging
  console.log('OpportunityForm rendered with:', { opportunity, opportunityId, mode })
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [_isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [peakData, setPeakData] = useState({
    peak_stage: opportunity?.peak_stage || 'prospecting' as const,
    deal_value: opportunity?.deal_value || undefined,
    probability: opportunity?.probability || undefined,
    close_date: opportunity?.close_date || ''
  })
  const [meddpiccData, setMeddpiccData] = useState({
    metrics: opportunity?.metrics || '',
    economic_buyer: opportunity?.economic_buyer || '',
    decision_criteria: opportunity?.decision_criteria || '',
    decision_process: opportunity?.decision_process || '',
    paper_process: opportunity?.paper_process || '',
    identify_pain: opportunity?.identify_pain || '',
    implicate_pain: opportunity?.implicate_pain || '',
    champion: opportunity?.champion || '',
    competition: opportunity?.competition || ''
  })
  const [showComprehensiveMEDDPICC, setShowComprehensiveMEDDPICC] = useState(false)
  const [meddpiccAssessment, _setMeddpiccAssessment] = useState<MEDDPICCAssessment | undefined>(undefined)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue: _setValue,
    reset
  } = useForm<LocalOpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity ? {
      name: opportunity.name,
      contact_id: opportunity.contact_id || '',
      company_id: opportunity.company_id || '',
    } : {}
  })

  const _watchedValues = watch()

  useEffect(() => {
    loadContacts()
    loadCompanies()
    if (mode === 'edit' && opportunityId && !opportunity) {
      loadOpportunity()
    }
  }, [mode, opportunityId, opportunity, loadOpportunity])

  const loadOpportunity = useCallback(async () => {
    if (!opportunityId) return
    
    const _result = await handleAsyncOperation(
      async () => {
        const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
        
        if (error) {
          throw new Error(error.message || 'Failed to load opportunity')
        }
        
        if (!data) {
          throw new Error('Opportunity not found')
        }
        
        // Reset the main form with loaded data
        reset({
          name: data.name,
          contact_id: data.contact_id || '',
          company_id: data.company_id || ''
        })
        
        // Update PEAK data
        setPeakData({
          peak_stage: data.peak_stage || 'prospecting' as const,
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
          implicate_pain: data.implicate_pain || '',
          champion: data.champion || '',
          competition: data.competition || ''
        })
        
        return data
      },
      setError,
      setLoading
    )
  }, [opportunityId, handleAsyncOperation, setError, setLoading, reset])

  const loadContacts = async () => {
    try {
      const { data, error } = await contactAPI.getContacts()
      if (error) {
        console.warn('Failed to load contacts:', error.message)
      } else {
        setContacts(data || [])
      }
    } catch (_err) {
      console.warn('Error loading contacts:', err)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await companyAPI.getCompanies()
      if (error) {
        console.warn('Failed to load companies:', error.message)
      } else {
        setCompanies(data || [])
      }
    } catch (_err) {
      console.warn('Error loading companies:', err)
    }
  }

  const handlePeakSave = async (data: PEAKFormData) => {
    setPeakData(data)
    setIsDirty(true)
    
    // If we're editing an existing opportunity, save PEAK data immediately
    if (mode === 'edit' && opportunityId) {
      try {
        const { error } = await opportunityAPI.updateOpportunity(opportunityId, data)
        if (error) {
          setError(error.message || 'Failed to save PEAK data')
        } else {
          // Trigger a custom event to notify other components that PEAK data was updated
          window.dispatchEvent(new CustomEvent('peakUpdated', { 
            detail: { opportunityId, data } 
          }))
        }
      } catch (_err) {
        setError('Failed to save PEAK data')
      }
    }
  }

  const handlePeakSuccess = () => {
    // Clear any existing errors when save is successful
    setError(null)
  }

  const handleMeddpiccSave = async (data: MEDDPICCFormData) => {
    setMeddpiccData(data)
    setIsDirty(true)
    
    // If we're editing an existing opportunity, save MEDDPICC data immediately
    if (mode === 'edit' && opportunityId) {
      try {
        // Use the unified scoring service for consistency
        const scoreResult = await meddpiccScoringService.getOpportunityScore(opportunityId, { ...opportunity, ...data })
        const meddpiccScore = scoreResult.score
        
        // Save both MEDDPICC data and calculated score
        const { error } = await opportunityAPI.updateMEDDPICC(opportunityId, {
          ...data,
          meddpicc_score: meddpiccScore
        })
        
        if (error) {
          setError(error.message || 'Failed to save MEDDPICC data')
        } else {
          // Trigger a custom event to notify other components that MEDDPICC data was updated
          window.dispatchEvent(new CustomEvent('meddpiccUpdated', { 
            detail: { opportunityId, data, score: meddpiccScore } 
          }))
          
          // Also trigger score update event
          window.dispatchEvent(new CustomEvent('meddpicc-score-updated', { 
            detail: { opportunityId, score: meddpiccScore } 
          }))
        }
      } catch (_err) {
        setError('Failed to save MEDDPICC data')
      }
    }
  }

  const handleMeddpiccSuccess = () => {
    // Clear any existing errors when save is successful
    setError(null)
  }

  // Data validation function
  const validateOpportunityData = (data: OpportunityFormData) => {
    const errors: string[] = []

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      errors.push('Opportunity name is required')
    }

    // Validate probability range
    if (data.probability !== undefined && data.probability !== null) {
      if (data.probability < 0 || data.probability > 100) {
        errors.push('Probability must be between 0 and 100')
      }
    }

    // Validate deal value
    if (data.deal_value !== undefined && data.deal_value !== null) {
      if (data.deal_value < 0) {
        errors.push('Deal value cannot be negative')
      }
    }

    // Validate close date
    if (data.close_date && data.close_date !== '') {
      const closeDate = new Date(data.close_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(closeDate.getTime())) {
        errors.push('Invalid close date format')
      } else if (closeDate < today) {
        errors.push('Close date cannot be in the past')
      }
    }

    return errors
  }

  const onSubmit = async (data: LocalOpportunityFormData) => {
    const result = await handleAsyncOperation(
      async () => {
        // Calculate MEDDPICC score from current data
        const meddpiccScore = calculateMEDDPICCScoreFromData(meddpiccData)
        
        // Prepare comprehensive opportunity data
        const opportunityData = {
          ...data,
          contact_id: data.contact_id || null,
          company_id: data.company_id || null,
          // Include PEAK data
          peak_stage: peakData.peak_stage,
          deal_value: peakData.deal_value || null,
          probability: peakData.probability || null,
          close_date: peakData.close_date || null,
          // Include MEDDPICC data
          metrics: meddpiccData.metrics || null,
          economic_buyer: meddpiccData.economic_buyer || null,
          decision_criteria: meddpiccData.decision_criteria || null,
          decision_process: meddpiccData.decision_process || null,
          paper_process: meddpiccData.paper_process || null,
          identify_pain: meddpiccData.identify_pain || null,
          implicate_pain: meddpiccData.implicate_pain || null,
          champion: meddpiccData.champion || null,
          competition: meddpiccData.competition || null,
          // Include calculated MEDDPICC score
          meddpicc_score: meddpiccScore,
        }

        // Validate data
        const validationErrors = validateOpportunityData(opportunityData)
        if (validationErrors.length > 0) {
          setValidationErrors(validationErrors)
          throw new Error('Validation failed')
        }

        console.log('Saving opportunity with data:', opportunityData)

        let result
        if (mode === 'create') {
          result = await opportunityAPI.createOpportunity(opportunityData)
        } else if (opportunityId) {
          // For updates, save all data in one call
          result = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
        }

        if (result?.error) {
          throw new Error(result.error.message || 'Failed to save opportunity')
        }

        console.log('Opportunity saved successfully')
        setLastSaved(new Date())
        setIsDirty(false)
        router.push('/opportunities')
        
        return result
      },
      setError,
      setLoading
    )

    if (result) {
      setValidationErrors([])
    }
  }

  return (
    <div className="w-full">
      <div className="bg-card shadow sm:rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
          
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

          {/* Save Status */}
          {lastSaved && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          <h3 className="text-lg leading-6 font-medium text-card-foreground">
            {mode === 'create' ? 'Create New Opportunity' : 'Edit Opportunity'}
          </h3>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              {mode === 'create' 
                ? 'Add a new opportunity to your sales pipeline.' 
                : 'Update the opportunity information below.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Opportunity Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    placeholder="e.g., Enterprise Software License"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact_id" className="block text-sm font-medium text-foreground">
                    Contact
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('contact_id')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                          {contact.company && ` (${contact.company.name})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="company_id" className="block text-sm font-medium text-foreground">
                    Company
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('company_id')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
            <MEDDPICCErrorBoundary>
              {showComprehensiveMEDDPICC ? (
                <div className="space-y-6">
                  {/* Toggle Button */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">MEDDPICC Qualification - Comprehensive View</h3>
                      <button
                        type="button"
                        onClick={() => setShowComprehensiveMEDDPICC(false)}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Switch to Simple View
                      </button>
                    </div>
                  </div>
                  
                  {/* MEDDPICC Dashboard */}
                  <MEDDPICCDashboard
                    opportunityId={opportunityId || ''}
                    assessment={meddpiccAssessment}
                  />
                  
                  {/* PEAK Integration */}
                  <MEDDPICCPEAKIntegration
                    opportunityId={opportunityId || ''}
                    currentPEAKStage={peakData.peak_stage}
                    assessment={meddpiccAssessment}
                    onStageAdvance={async (fromStage, toStage) => {
                      try {
                        await opportunityAPI.updatePeakStage(opportunityId!, toStage as string)
                        setPeakData(prev => ({ ...prev, peak_stage: toStage as string }))
                      } catch (error) {
                        console.error('Error advancing stage:', error)
                      }
                    }}
                  />
                  
                  {/* Comprehensive MEDDPICC Form */}
                  <MEDDPICCForm
                    opportunityId={opportunityId}
                    initialData={meddpiccData}
                    onSave={handleMeddpiccSave}
                    onSuccess={handleMeddpiccSuccess}
                    loading={loading}
                    useComprehensiveView={true}
                  />
                </div>
              ) : (
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
                  
                  <MEDDPICCForm
                    initialData={meddpiccData}
                    onSave={handleMeddpiccSave}
                    onSuccess={handleMeddpiccSuccess}
                    loading={loading}
                  />
                </div>
              )}
            </MEDDPICCErrorBoundary>

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
    </div>
  )
}
