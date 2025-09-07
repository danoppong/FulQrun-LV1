'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import Link from 'next/link'

interface OpportunityViewProps {
  opportunityId: string
}

export default function OpportunityView({ opportunityId }: OpportunityViewProps) {
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOpportunity()
  }, [opportunityId])

  const loadOpportunity = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await opportunityAPI.getOpportunity(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to load opportunity')
      } else {
        setOpportunity(data)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4">
          <Link
            href="/opportunities"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Opportunity not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The opportunity you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{opportunity.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Created {new Date(opportunity.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{opportunity.name}</dd>
            </div>
            {opportunity.contact && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Contact</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {opportunity.contact.first_name} {opportunity.contact.last_name}
                </dd>
              </div>
            )}
            {opportunity.company && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {opportunity.company.name}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}