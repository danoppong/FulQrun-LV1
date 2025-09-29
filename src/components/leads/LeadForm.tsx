'use client'
import React from 'react'

import { useState, useEffect, useCallback } from 'react'
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
  leadId?: string
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

export default function LeadForm({ lead, leadId, mode }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
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

  const loadLead = useCallback(async () => {
    if (!leadId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await leadAPI.getLead(leadId)
      
      if (error) {
        setError(error.message || 'Failed to load lead')
      } else if (data) {
        // Update form with loaded data
        setValue('first_name', data.first_name)
        setValue('last_name', data.last_name)
        setValue('email', data.email || '')
        setValue('phone', data.phone || '')
        setValue('company', data.company || '')
        setValue('source', data.source || '')
        setValue('status', data.status)
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [leadId, setValue])

  useEffect(() => {
    if (mode === 'edit' && leadId && !lead) {
      loadLead()
    }
  }, [mode, leadId, lead, loadLead])

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
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card shadow sm:rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-card-foreground">
            {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">
            <p>
              {mode === 'create' 
                ? 'Add a new lead to your pipeline. The lead will be automatically scored based on available information.' 
                : 'Update the lead information below.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-foreground">
                  First Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('first_name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-foreground">
                  Last Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('last_name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    {...register('email')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    {...register('phone')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground">
                  Company
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('company')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-foreground">
                  Source
                </label>
                <div className="mt-1">
                  <select
                    {...register('source')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
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
                  <label htmlFor="status" className="block text-sm font-medium text-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('status')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
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
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <h4 className="text-sm font-medium text-primary mb-2">Lead Scoring Preview</h4>
                <p className="text-sm text-primary/80">
                  This lead will be automatically scored based on the information provided. 
                  Complete more fields to increase the lead score.
                </p>
              </div>
            )}

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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
