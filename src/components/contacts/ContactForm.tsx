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
  mode: 'create' | 'edit'
}

export default function ContactForm({ contact, mode }: ContactFormProps) {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
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
  }, [])

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
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {mode === 'create' 
                ? 'Add a new contact to your database.' 
                : 'Update the contact information below.'
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
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('title')}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Update Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
