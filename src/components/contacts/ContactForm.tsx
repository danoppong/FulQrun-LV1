'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  company_id: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  contact?: ContactWithCompany
  contactId?: string
  mode: 'create' | 'edit'
}

export default function ContactForm({ contact, contactId, mode }: ContactFormProps) {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact ? {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      company_id: contact.company_id || '',
    } : {}
  })

  useEffect(() => {
    loadCompanies()
    if (mode === 'edit' && contactId && !contact) {
      loadContact()
    }
  }, [mode, contactId, contact])

  const loadContact = async () => {
    if (!contactId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await contactAPI.getContact(contactId)
      
      if (error) {
        setError(error.message || 'Failed to load contact')
      } else if (data) {
        // Update form with loaded data
        setValue('first_name', data.first_name)
        setValue('last_name', data.last_name)
        setValue('email', data.email || '')
        setValue('phone', data.phone || '')
        setValue('title', data.title || '')
        setValue('company_id', data.company_id || '')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
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

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    setError(null)

    try {
      const contactData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
        company_id: data.company_id || null,
      }

      let result
      if (mode === 'create') {
        result = await contactAPI.createContact(contactData)
      } else if (contact) {
        result = await contactAPI.updateContact(contact.id, contactData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save contact')
      } else {
        router.push('/contacts')
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
            {mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">
            <p>
              {mode === 'create' 
                ? 'Add a new contact to your database.' 
                : 'Update the contact information below.'
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
                <label htmlFor="title" className="block text-sm font-medium text-foreground">
                  Job Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('title')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Update Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
