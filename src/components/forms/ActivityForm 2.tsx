'use client'
import React from 'react';

import { useState, useEffect, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { activityAPI as _activityAPI } from '@/lib/api/activities'
import { contactAPI, ContactWithCompany } from '@/lib/api/contacts';

const activitySchema = z.object({
  type: z.enum(['email', 'call', 'meeting', 'task']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  contact_id: z.string().optional(),
  opportunity_id: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
  opportunityId?: string
  contactId?: string
  initialData?: Partial<ActivityFormData>
  onSave: (data: ActivityFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const activityTypes = [
  { value: 'email', label: 'Email', icon: '📧', description: 'Send or receive emails' },
  { value: 'call', label: 'Phone Call', icon: '📞', description: 'Make or receive phone calls' },
  { value: 'meeting', label: 'Meeting', icon: '🤝', description: 'In-person or virtual meetings' },
  { value: 'task', label: 'Task', icon: '✅', description: 'Follow-up tasks and actions' },
]

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'completed', label: 'Completed', color: 'text-green-600 bg-green-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600 bg-gray-100' },
]

const ActivityForm = memo(function ActivityForm({ 
  opportunityId, 
  contactId, 
  initialData, 
  onSave, 
  onCancel, 
  loading = false 
}: ActivityFormProps) {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue: _setValue
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'task',
      status: 'pending',
      priority: 'medium',
      opportunity_id: opportunityId,
      contact_id: contactId,
      ...initialData
    }
  })

  const watchedType = watch('type')

  // Load contacts for the opportunity
  useEffect(() => {
    if (opportunityId) {
      loadContacts()
    }
  }, [opportunityId])

  const loadContacts = async () => {
    setLoadingContacts(true)
    setContactsError(null)
    try {
      const { data, error } = await contactAPI.getContacts()
      if (error) {
        setContactsError(error.message || 'Failed to load contacts')
      } else if (data) {
        setContacts(data)
      }
    } catch (_error) {
      const errorMessage = 'An unexpected error occurred while loading contacts'
      setContactsError(errorMessage)
    } finally {
      setLoadingContacts(false)
    }
  }

  const onSubmit = async (data: ActivityFormData) => {
    try {
      await onSave(data)
    } catch (_error) {
    }
  }

  const _getTypeIcon = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type)
    return activityType?.icon || '📝'
  }

  const _getTypeDescription = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type)
    return activityType?.description || ''
  }

  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {initialData ? 'Edit Activity' : 'New Activity'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {initialData ? 'Update activity details' : 'Create a new activity for this opportunity'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Activity Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    watchedType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    value={type.value}
                    {...register('type')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              {...register('subject')}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
              placeholder="Enter activity subject"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Contact Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Contact
            </label>
            {loadingContacts ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm text-gray-500">Loading contacts...</span>
              </div>
            ) : contactsError ? (
              <div className="rounded-md bg-red-50 p-3">
                <div className="text-sm text-red-700">{contactsError}</div>
                <button
                  type="button"
                  onClick={loadContacts}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : contacts.length > 0 ? (
              <select
                {...register('contact_id')}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
              >
                <option value="">Select a contact (optional)</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} {contact.email ? `(${contact.email})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500">No contacts available</div>
            )}
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
              >
                {priorityLevels.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              {...register('due_date')}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-3 py-2"
              placeholder="Enter activity details, notes, or outcomes..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Activity' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

export default ActivityForm
