'use client'
import React from 'react';

import { useState, useEffect, useCallback } from 'react'
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import { AuthService } from '@/lib/auth-unified'
import { meddpiccScoringService } from '@/lib/services/meddpicc-scoring'
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface OpportunityListProps {
  searchQuery?: string
  stageFilter?: string
}

const peakStages = [
  { value: '', label: 'All Stages' },
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'engaging', label: 'Engaging' },
  { value: 'advancing', label: 'Advancing' },
  { value: 'key_decision', label: 'Key Decision' }
]

export default function OpportunityList({ searchQuery = '', stageFilter = '' }: OpportunityListProps) {
  const [opportunities, setOpportunities] = useState<OpportunityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedStage, setSelectedStage] = useState(stageFilter)
  const [meddpiccScores, setMeddpiccScores] = useState<Record<string, number>>({})
  const [ownersMap, setOwnersMap] = useState<Record<string, string>>({})
  const [ownerFilter, setOwnerFilter] = useState<string>('')
  const [regionFilter, setRegionFilter] = useState<string>('')
  const [ownerOptions, setOwnerOptions] = useState<Array<{ value: string; label: string }>>([])
  const [regionOptions, setRegionOptions] = useState<Array<{ value: string; label: string }>>([])

  // Stable supabase client (avoid adding to effect deps)
  const supabase = React.useMemo(() => AuthService.getClient(), [])

  // Function to get MEDDPICC score for an opportunity using the unified service
  const getOpportunityMEDDPICCScore = async (opportunity: OpportunityWithDetails): Promise<number> => {
    try {
      // Use the optimized scoring service with opportunity data
      const scoreResult = await meddpiccScoringService.getOpportunityScore(opportunity.id, opportunity as { id: string; name: string; [key: string]: unknown })
      return scoreResult.score
    } catch (error) {
      console.error('Error getting MEDDPICC score:', error)
      // Fallback to database score if available
      return opportunity.meddpicc_score || 0
    }
  }

  
  

  // Listen for MEDDPICC score updates to refresh the list
  useEffect(() => {
    const handleScoreUpdate = (event: CustomEvent) => {
      const { opportunityId, score } = event.detail
      if (opportunityId && typeof score === 'number') {
        setMeddpiccScores(prev => ({
          ...prev,
          [opportunityId]: score
        }))
        // Invalidate cache to ensure fresh calculation next time
        meddpiccScoringService.invalidateScore(opportunityId)
      }
    }

    window.addEventListener('meddpicc-score-updated', handleScoreUpdate as EventListener)
    
    return () => {
      window.removeEventListener('meddpicc-score-updated', handleScoreUpdate as EventListener)
    }
  }, [])

  // Helper: compute region for an opportunity (region or territory fallback)
  const getRegion = (opp: OpportunityWithDetails): string | null => {
    const anyOpp = opp as unknown as { region?: string | null; territory_name?: string | null; territory?: string | null }
    return anyOpp.region || anyOpp.territory_name || anyOpp.territory || null
  }

  // Load owner display names and derive filter options
  const loadOwnersAndRegions = useCallback(async (opps: OpportunityWithDetails[]) => {
    try {
      const ownerIds = Array.from(
        new Set(
          (opps || []).map(o => (o as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to).filter(Boolean)
        )
      ) as string[]

      const map: Record<string, string> = {}
      if (ownerIds.length > 0) {
        // Prefer user_profiles.full_name
        const { data: profiles } = await supabase
          .from('user_profiles' as const)
          .select('id, full_name')
          .in('id', ownerIds)

        for (const p of (profiles || []) as Array<{ id: string; full_name: string | null }>) {
          if (p && p.id) map[p.id] = p.full_name || p.id
        }
      }
      setOwnersMap(map)
      setOwnerOptions([{ value: '', label: 'All Owners' }, ...Object.entries(map)
        .map(([value, label]) => ({ value, label: label || value }))
        .sort((a, b) => a.label.localeCompare(b.label))])

      const regions = Array.from(new Set((opps || []).map(o => getRegion(o)).filter(Boolean))) as string[]
      setRegionOptions([{ value: '', label: 'All Regions' }, ...regions.sort().map(r => ({ value: r, label: r }))])
    } catch (e) {
      // Non-fatal; leave filters minimal
      console.warn('Failed loading owner/region metadata', e)
      setOwnerOptions([{ value: '', label: 'All Owners' }])
      setRegionOptions([{ value: '', label: 'All Regions' }])
    }
  }, [supabase])

  const loadOpportunities = useCallback(async (query: string = '', stage: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      let result
      if (stage) {
        result = await opportunityAPI.getOpportunitiesByStage(stage)
      } else if (query) {
        result = await opportunityAPI.searchOpportunities(query)
      } else {
        result = await opportunityAPI.getOpportunities()
      }
      
      if (result.error) {
        setError(result.error.message || 'Failed to load opportunities')
      } else {
        const opportunitiesData = result.data || []
        setOpportunities(opportunitiesData)
        
        // Calculate MEDDPICC scores for all opportunities (optimized)
        const scores: Record<string, number> = {}
        
        // Use Promise.all for parallel processing instead of sequential
        const scorePromises = opportunitiesData.map(async (opportunity) => {
          try {
            const score = await getOpportunityMEDDPICCScore(opportunity)
            return { id: opportunity.id, score }
          } catch (error) {
            console.error(`Error calculating score for ${opportunity.id}:`, error)
            return { id: opportunity.id, score: opportunity.meddpicc_score || 0 }
          }
        })
        
        const scoreResults = await Promise.all(scorePromises)
        scoreResults.forEach(({ id, score }) => {
          scores[id] = score
        })
        
        setMeddpiccScores(scores)

        // Resolve owner names and region options for quick filters
        await loadOwnersAndRegions(opportunitiesData)
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [loadOwnersAndRegions])

  // Trigger initial and subsequent loads when filters change
  useEffect(() => {
    loadOpportunities(searchTerm, selectedStage)
  }, [searchTerm, selectedStage, loadOpportunities])

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-blue-100 text-blue-800'
      case 'engaging':
        return 'bg-yellow-100 text-yellow-800'
      case 'advancing':
        return 'bg-orange-100 text-orange-800'
      case 'key_decision':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return

    try {
      const { error } = await opportunityAPI.deleteOpportunity(id)
      if (error) {
        setError(error.message || 'Failed to delete opportunity')
      } else {
        setOpportunities(prev => prev.filter(opp => opp.id !== id))
      }
    } catch (_err) {
      setError('Failed to delete opportunity')
    }
  }
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return '🔍'
      case 'engaging':
        return '💬'
      case 'advancing':
        return '📈'
      case 'key_decision':
        return '🎯'
      default:
        return '📊'
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Apply client-side Owner/Region quick filters (no hook to avoid conditional hook order issues)
  const filteredOpportunities = opportunities.filter(o => {
    const matchesOwner = ownerFilter ? ((o as { assigned_to?: string | null }).assigned_to === ownerFilter) : true
    const matchesRegion = regionFilter ? (getRegion(o) === regionFilter) : true
    return matchesOwner && matchesRegion
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your sales pipeline with PEAK stages and MEDDPICC qualification
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/opportunities/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Opportunity
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {peakStages.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-56">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {ownerOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {regionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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

      {/* Column Headings (desktop) */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 text-xs font-semibold text-gray-500">
        <div className="col-span-3 uppercase">Opportunity</div>
        <div className="col-span-2 uppercase">Account</div>
        <div className="col-span-2 uppercase">Owner</div>
        <div className="col-span-2 uppercase">Region</div>
        <div className="col-span-1 uppercase">PEAK Stage</div>
        <div className="col-span-1 uppercase text-right">MEDDPICC</div>
        <div className="col-span-1 uppercase text-right">Amount</div>
        <div className="col-span-1 uppercase text-right hidden">Close</div>
      </div>

      {/* Opportunities Table */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStage || ownerFilter || regionFilter ? 'No opportunities match your filters.' : 'Get started by creating a new opportunity.'}
          </p>
          {!searchTerm && !selectedStage && !ownerFilter && !regionFilter && (
            <div className="mt-6">
              <Link
                href="/opportunities/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Opportunity
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredOpportunities.map((opportunity) => (
              <li key={opportunity.id}>
                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Opportunity and Account */}
                  <div className="sm:col-span-3 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {opportunity.name[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/opportunities/${opportunity.id}`} className="hover:underline">
                          {opportunity.name}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500">
                        {opportunity.company?.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="sm:col-span-2 text-sm text-gray-700">
                    {(() => {
                      const ownerId = (opportunity as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to || ''
                      return ownerId ? (ownersMap[ownerId] || ownerId) : '—'
                    })()}
                  </div>

                  {/* Region */}
                  <div className="sm:col-span-2 text-sm text-gray-700">
                    {getRegion(opportunity) || '—'}
                  </div>

                  {/* PEAK Stage */}
                  <div className="sm:col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(opportunity.peak_stage)}`}>
                      {getStageIcon(opportunity.peak_stage)} {opportunity.peak_stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  {/* MEDDPICC */}
                  <div className="sm:col-span-1 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {(meddpiccScores[opportunity.id] ?? opportunity.meddpicc_score ?? 0)}%
                    </div>
                    <div className="text-xs text-gray-500">Qualification</div>
                  </div>

                  {/* Amount and probability */}
                  <div className="sm:col-span-1 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(opportunity.deal_value)}
                    </div>
                    {opportunity.probability && (
                      <div className="text-xs text-gray-500">{opportunity.probability}% prob.</div>
                    )}
                  </div>

                  {/* Close date (mobile shows below name; desktop here) */}
                  <div className="hidden sm:block sm:col-span-1 text-right text-sm text-gray-700">
                    {opportunity.close_date ? new Date(opportunity.close_date).toLocaleDateString() : '—'}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex items-center justify-end space-x-2">
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/opportunities/${opportunity.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(opportunity.id)}
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
