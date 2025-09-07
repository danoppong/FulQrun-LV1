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
import { ErrorBoundary } from '@/components/ErrorBoundary'

const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
  opportunity?: OpportunityWithDetails
  mode: 'create' | 'edit'
}

// PEAK stages moved to PEAKForm component

export default function OpportunityForm({ opportunity, mode }: OpportunityFormProps) {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
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
  }, [])

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
  }

  const handleMeddpiccSave = async (data: any) => {
    setMeddpiccData(data)
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
      } else if (opportunity) {
        result = await opportunityAPI.updateOpportunity(opportunity.id, opportunityData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save opportunity')
      } else {
        // Save MEDDPICC data separately
        if (opportunity) {
          await opportunityAPI.updateMEDDPICC(opportunity.id, meddpiccData)
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {mode === 'create' ? 'Create New Opportunity' : 'Edit Opportunity'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {mode === 'create' 
                ? 'Add a new opportunity to your sales pipeline.' 
                : 'Update the opportunity information below.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Opportunity Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('name')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., Enterprise Software License"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                    Contact
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('contact_id')}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                  <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('company_id')}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                loading={loading}
              />
            </ErrorBoundary>

            {/* MEDDPICC Qualification */}
            <ErrorBoundary>
              <MEDDPICCForm
                initialData={meddpiccData}
                onSave={handleMeddpiccSave}
                loading={loading}
              />
            </ErrorBoundary>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
