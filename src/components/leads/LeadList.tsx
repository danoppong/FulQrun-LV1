'use client'

import { useState, useEffect } from 'react'
import { leadAPI, LeadWithScore } from '@/lib/api/leads'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import { leadScoringEngine } from '@/lib/scoring/leadScoring'

interface LeadListProps {
  searchQuery?: string
  statusFilter?: string
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' }
]

export default function LeadList({ searchQuery = '', statusFilter = '' }: LeadListProps) {
  const [leads, setLeads] = useState<LeadWithScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedStatus, setSelectedStatus] = useState(statusFilter)

  const loadLeads = async (query: string = '', status: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      let result
      if (status) {
        result = await leadAPI.getLeadsByStatus(status)
      } else if (query) {
        result = await leadAPI.searchLeads(query)
      } else {
        result = await leadAPI.getLeads()
      }
      
      if (result.error) {
        setError(result.error.message || 'Failed to load leads')
      } else {
        setLeads(result.data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads(searchTerm, selectedStatus)
  }, [searchTerm, selectedStatus])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const { error } = await leadAPI.deleteLead(id)
      if (error) {
        setError(error.message || 'Failed to delete lead')
      } else {
        setLeads(leads.filter(lead => lead.id !== id))
      }
    } catch (err) {
      setError('Failed to delete lead')
    }
  }

  const handleConvertToOpportunity = async (lead: LeadWithScore) => {
    const opportunityName = prompt('Enter opportunity name:', `${lead.first_name} ${lead.last_name} - ${lead.company || 'Unknown Company'}`)
    if (!opportunityName) return

    try {
      const { error } = await leadAPI.convertLeadToOpportunity(lead.id, {
        name: opportunityName
      })
      
      if (error) {
        setError(error.message || 'Failed to convert lead')
      } else {
        // Reload leads to update the status
        loadLeads(searchTerm, selectedStatus)
      }
    } catch (err) {
      setError('Failed to convert lead')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your lead pipeline with automated scoring
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/leads/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStatus ? 'No leads match your filters.' : 'Get started by creating a new lead.'}
          </p>
          {!searchTerm && !selectedStatus && (
            <div className="mt-6">
              <Link
                href="/leads/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Lead
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <li key={lead.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.email && (
                              <span>{lead.email}</span>
                            )}
                            {lead.phone && (
                              <span className={lead.email ? 'ml-2' : ''}>{lead.phone}</span>
                            )}
                          </div>
                          {lead.company && (
                            <div className="text-sm text-indigo-600">
                              {lead.company}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          {/* Score Display */}
                          {lead.score_breakdown && (
                            <div className="text-right">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leadScoringEngine.getCategoryColor(lead.score_breakdown.category)}`}>
                                {leadScoringEngine.getCategoryIcon(lead.score_breakdown.category)} {lead.score_breakdown.percentage}%
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Score: {lead.score_breakdown.totalScore}
                              </div>
                            </div>
                          )}
                          
                          {/* Status */}
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                              lead.status === 'unqualified' ? 'bg-red-100 text-red-800' :
                              lead.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {lead.status !== 'converted' && (
                      <button
                        onClick={() => handleConvertToOpportunity(lead)}
                        className="text-green-600 hover:text-green-900"
                        title="Convert to Opportunity"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      href={`/leads/${lead.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
