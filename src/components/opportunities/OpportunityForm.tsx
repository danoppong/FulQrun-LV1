'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PEAKForm from '@/components/forms/PEAKForm'
import MEDDPICCForm from '@/components/forms/MEDDPICCForm'
import { MEDDPICCDashboard, MEDDPICCPEAKIntegration } from '@/components/meddpicc'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
  opportunity?: OpportunityWithDetails
  opportunityId?: string
  mode: 'create' | 'edit'
}

// PEAK stages moved to PEAKForm component

export default function OpportunityForm({ opportunity, opportunityId, mode }: OpportunityFormProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    champion: opportunity?.champion || '',
    competition: opportunity?.competition || ''
  })
  const [showComprehensiveMEDDPICC, setShowComprehensiveMEDDPICC] = useState(false)
  const [meddpiccAssessment, setMeddpiccAssessment] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity ? {
      name: opportunity.name,
      contact_id: opportunity.contact_id || '',
      company_id: opportunity.company_id || '',
    } : {}
  })

  const watchedValues = watch()

  useEffect(() => {
    loadContacts()
    loadCompanies()
    if (mode === 'edit' && opportunityId && !opportunity) {
      loadOpportunity()
    }
  }, [mode, opportunityId, opportunity])

  const loadOpportunity = async () => {
    if (!opportunityId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to load opportunity')
      } else if (data) {
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
          champion: data.champion || '',
          competition: data.competition || ''
        })
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const { data, error } = await contactAPI.getContacts()
      if (error) {
        // Handle contact loading error
      } else {
        setContacts(data || [])
      }
    } catch (err) {
      // Handle contact loading error
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await companyAPI.getCompanies()
      if (error) {
        // Handle company loading error
      } else {
        setCompanies(data || [])
      }
    } catch (err) {
      // Handle company loading error
    }
  }

  const handlePeakSave = async (data: any) => {
    setPeakData(data)
    
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
      } catch (err) {
        setError('Failed to save PEAK data')
      }
    }
  }

  const handlePeakSuccess = () => {
    // Clear any existing errors when save is successful
    setError(null)
  }

  const handleMeddpiccSave = async (data: any) => {
    setMeddpiccData(data)
    
    // If we're editing an existing opportunity, save MEDDPICC data immediately
    if (mode === 'edit' && opportunityId) {
      try {
        const { error } = await opportunityAPI.updateMEDDPICC(opportunityId, data)
        if (error) {
          setError(error.message || 'Failed to save MEDDPICC data')
        } else {
          // Trigger a custom event to notify other components that MEDDPICC data was updated
          window.dispatchEvent(new CustomEvent('meddpiccUpdated', { 
            detail: { opportunityId, data } 
          }))
        }
      } catch (err) {
        setError('Failed to save MEDDPICC data')
      }
    }
  }

  const handleMeddpiccSuccess = () => {
    // Clear any existing errors when save is successful
    setError(null)
  }

  const onSubmit = async (data: OpportunityFormData) => {
    setLoading(true)
    setError(null)

    try {
      const opportunityData = {
        ...data,
        contact_id: data.contact_id || null,
        company_id: data.company_id || null,
        ...peakData,
        deal_value: peakData.deal_value || null,
        probability: peakData.probability || null,
        close_date: peakData.close_date || null,
      }

      let result
      if (mode === 'create') {
        result = await opportunityAPI.createOpportunity(opportunityData)
      } else if (opportunityId) {
        result = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save opportunity')
      } else {
        // Save MEDDPICC data separately
        if (opportunityId) {
          await opportunityAPI.updateMEDDPICC(opportunityId, meddpiccData)
        }
        router.push('/opportunities')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="bg-card shadow sm:rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
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
            <ErrorBoundary>
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
                        await opportunityAPI.updatePeakStage(opportunityId!, toStage as any)
                        setPeakData(prev => ({ ...prev, peak_stage: toStage as any }))
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
            </ErrorBoundary>

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
