'use client'
import React from 'react'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  address: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormProps {
  company?: CompanyWithStats
  companyId?: string
  mode: 'create' | 'edit'
}

const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Other'
]

const sizeOptions = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
]

export default function CompanyForm({ company, companyId, mode }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company ? {
      name: company.name,
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.size || '',
      address: company.address || '',
    } : {}
  })

  useEffect(() => {
    if (mode === 'edit' && companyId && !company) {
      loadCompany()
    }
  }, [mode, companyId, company, loadCompany])

  const loadCompany = async () => {
    if (!companyId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await companyAPI.getCompany(companyId)
      
      if (error) {
        setError(error.message || 'Failed to load company')
      } else if (data) {
        // Update form with loaded data
        setValue('name', data.name)
        setValue('domain', data.domain || '')
        setValue('industry', data.industry || '')
        setValue('size', data.size || '')
        setValue('address', data.address || '')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    setError(null)

    try {
      const companyData = {
        ...data,
        domain: data.domain || null,
        industry: data.industry || null,
        size: data.size || null,
        address: data.address || null,
      }

      let result
      if (mode === 'create') {
        result = await companyAPI.createCompany(companyData)
      } else if (company) {
        result = await companyAPI.updateCompany(company.id, companyData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save company')
      } else {
        router.push('/companies')
      }
    } catch (err) {
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
            {mode === 'create' ? 'Create New Company' : 'Edit Company'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">
            <p>
              {mode === 'create' 
                ? 'Add a new company to your database.' 
                : 'Update the company information below.'
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
                  Company Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    placeholder="Acme Corporation"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-foreground">
                    Website Domain
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...register('domain')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                      placeholder="acme.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-foreground">
                    Industry
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('industry')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    >
                      <option value="">Select an industry</option>
                      {industryOptions.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-foreground">
                    Company Size
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('size')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    >
                      <option value="">Select company size</option>
                      {sizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>
            </div>

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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Company' : 'Update Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
