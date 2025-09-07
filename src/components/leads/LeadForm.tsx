'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { leadAPI, LeadWithScore } from '@/lib/api/leads'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadFormProps {
  lead?: LeadWithScore
  mode: 'create' | 'edit'
}

const sourceOptions = [
  'website',
  'social',
  'referral',
  'trade_show',
  'cold_outreach',
  'email_campaign',
  'advertisement',
  'other'
]

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' }
]

export default function LeadForm({ lead, mode }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead ? {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || '',
      status: lead.status
    } : {
      status: 'new'
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true)
    setError(null)

    try {
      const leadData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source || null,
      }

      let result
      if (mode === 'create') {
        result = await leadAPI.createLead(leadData)
      } else if (lead) {
        result = await leadAPI.updateLead(lead.id, leadData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save lead')
      } else {
        router.push('/leads')
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
            {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {mode === 'create' 
                ? 'Add a new lead to your pipeline. The lead will be automatically scored based on available information.' 
                : 'Update the lead information below.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('first_name')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('last_name')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    {...register('email')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    {...register('phone')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('company')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source
                </label>
                <div className="mt-1">
                  <select
                    {...register('source')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select a source</option>
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {mode === 'edit' && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('status')}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Lead Scoring Preview */}
            {mode === 'create' && (watchedValues.first_name || watchedValues.last_name) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Lead Scoring Preview</h4>
                <p className="text-sm text-blue-700">
                  This lead will be automatically scored based on the information provided. 
                  Complete more fields to increase the lead score.
                </p>
              </div>
            )}

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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
