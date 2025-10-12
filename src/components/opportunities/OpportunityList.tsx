'use client'
import React from 'react';

import { useState, useEffect, useCallback, useRef } from 'react'
import { opportunityAPI, OpportunityWithDetails } from '@/lib/api/opportunities'
import { AuthService } from '@/lib/auth-unified'
import { meddpiccScoringService } from '@/lib/services/meddpicc-scoring'
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrencySafe } from '@/lib/format'
import { UserSelect } from '@/components/common/UserSelect'
import { useSearchParams } from 'next/navigation'

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
  const opportunitiesRef = React.useRef<OpportunityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedStage, setSelectedStage] = useState(stageFilter)
  const [meddpiccScores, setMeddpiccScores] = useState<Record<string, number>>({})
  const [ownersMap, setOwnersMap] = useState<Record<string, string>>({})
  const [ownerRegionsMap, setOwnerRegionsMap] = useState<Record<string, string>>({})
  const [ownerFilter, setOwnerFilter] = useState<string>('')
  const [regionFilter, setRegionFilter] = useState<string>('')
  // Owner options now provided by shared UserSelect; keep only selected owner id
  const [regionOptions, setRegionOptions] = useState<Array<{ value: string; label: string }>>([])
  const [offset, setOffset] = useState(0)
  const [orgId, setOrgId] = useState<string | null>(null)
  const pageSize = 50
  const [hasMore, setHasMore] = useState(true)
  const searchParams = useSearchParams()
  const initializedFromURL = useRef(false)

  // Debounced search term to avoid firing queries on each keystroke
  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay)
      return () => clearTimeout(id)
    }, [value, delay])
    return debounced
  }

  // Load current org id once for RLS-safe queries
  useEffect(() => {
    let mounted = true
    AuthService.getCurrentUser()
      .then(u => { if (mounted) setOrgId(u?.profile?.organization_id || null) })
      .catch(() => { if (mounted) setOrgId(null) })
    return () => { mounted = false }
  }, [])

  // Initialize filters from URL search params (deep-link support) once
  useEffect(() => {
    if (initializedFromURL.current) return
    const ownerId = searchParams.get('ownerId')
    const region = searchParams.get('region')
    const stage = searchParams.get('stage')
    const q = searchParams.get('q')
    if (ownerId) setOwnerFilter(ownerId)
    if (region) setRegionFilter(region)
    if (stage) setSelectedStage(stage)
    if (q) setSearchTerm(q)
    initializedFromURL.current = true
  }, [searchParams])

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

  // Helper: get region from user data instead of territory mapping
  const getRegion = (opp: OpportunityWithDetails): string | null => {
    const ownerId = (opp as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to || ''
    return (ownerId && ownerRegionsMap[ownerId]) || null
  }

  // Load owner display names and derive filter options
  const loadOwnersAndRegions = useCallback(async (opps: OpportunityWithDetails[]) => {
    if (!orgId) return
    try {
      const ownerIds = Array.from(
        new Set(
          (opps || []).map(o => (o as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to).filter(Boolean)
        )
      ) as string[]

      const map: Record<string, string> = {}
      const regionMap: Record<string, string> = {}
      if (ownerIds.length > 0) {
        // Fetch user data from admin users API (reads from users table with regions included)
        try {
          const response = await fetch('/api/admin/users?limit=1000&includeRegions=true')
          if (response.ok) {
            const result = await response.json()
            const users = result.users || []
            for (const user of users) {
              if (user.id && ownerIds.includes(user.id)) {
                map[user.id] = user.fullName || user.email || user.id
                if (user.region) {
                  regionMap[user.id] = user.region
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch user names:', error)
          // Fallback: use user IDs as display names
          for (const id of ownerIds) {
            map[id] = id
          }
        }
      }
      setOwnersMap(map)
      setOwnerRegionsMap(regionMap)

      // Fetch regions from organization data API
      let regions: string[] = []
      try {
        const response = await fetch('/api/admin/organization/data?type=region&isActive=true')
        if (response.ok) {
          const result = await response.json()
          const regionData = result.data || []
          regions = regionData
            .filter((item: { type: string; name: string }) => item.type === 'region' && item.name)
            .map((item: { name: string }) => item.name)
            .sort()
        }
      } catch (error) {
        console.error('Failed to fetch regions from organization data:', error)
        // No fallback - organization data is the primary source for regions
      }

      setRegionOptions([{ value: '', label: 'All Regions' }, ...regions.map(r => ({ value: r, label: r }))])
    } catch (e) {
      // Non-fatal; leave filters minimal
      console.warn('Failed loading owner/region metadata', e)
      setRegionOptions([{ value: '', label: 'All Regions' }])
    }
  }, [orgId])

  const loadOpportunities = useCallback(async (query: string = '', stage: string = '', resetList = true, explicitOffset?: number) => {
    if (resetList) setLoading(true)
    setError(null)
    try {
      const { data, error } = await opportunityAPI.getOpportunitiesList({
        search: query,
        stage: (stage || '') as 'prospecting' | 'engaging' | 'advancing' | 'key_decision' | '',
        limit: pageSize,
        offset: resetList ? 0 : (explicitOffset ?? 0),
      })

      if (error) {
        setError(error.message || 'Failed to load opportunities')
        return
      }

  const list = data || []
  const merged = resetList ? list : [...opportunitiesRef.current, ...list]
  setOpportunities(merged)
  setHasMore(list.length === pageSize)
  opportunitiesRef.current = merged

      // Compute MEDDPICC scores only for the first page to avoid heavy bursts
      if (resetList) {
        const scores: Record<string, number> = {}
        const scoreResults = await Promise.all(list.map(async (opportunity) => {
          try {
            const score = await getOpportunityMEDDPICCScore(opportunity)
            return { id: opportunity.id, score }
          } catch (error) {
            console.error(`Error calculating score for ${opportunity.id}:`, error)
            return { id: opportunity.id, score: opportunity.meddpicc_score || 0 }
          }
        }))
        scoreResults.forEach(({ id, score }) => { scores[id] = score })
        setMeddpiccScores(scores)
      }

      await loadOwnersAndRegions(merged)
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      if (resetList) setLoading(false)
    }
  }, [pageSize, loadOwnersAndRegions])

  // Trigger initial and subsequent loads when filters change
  useEffect(() => {
    setOffset(0)
    // Call and include loadOpportunities in deps to satisfy lint; it's stable via useCallback
    void (async () => {
      await loadOpportunities(debouncedSearch, selectedStage, true, 0)
    })()
  }, [debouncedSearch, selectedStage, loadOpportunities])

  const loadMore = useCallback(async () => {
    try {
      setLoadingMore(true)
      const nextOffset = offset + pageSize
      setOffset(nextOffset)
      await loadOpportunities(debouncedSearch, selectedStage, false, nextOffset)
    } finally {
      setLoadingMore(false)
    }
  }, [offset, pageSize, debouncedSearch, selectedStage, loadOpportunities])

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
    // Preserve existing display for falsy values (including 0) as 'N/A' to avoid UI regression
    if (!amount) return 'N/A'
    return formatCurrencySafe(amount)
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
          <UserSelect
            value={ownerFilter}
            onChange={setOwnerFilter}
            allowEmpty
            emptyLabel="All Owners"
          />
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
      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 text-xs font-semibold text-gray-500 sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b">
        <div className="col-span-3 uppercase">Opportunity</div>
        <div className="col-span-2 uppercase">Account</div>
        <div className="col-span-2 uppercase">Owner</div>
        <div className="col-span-1 uppercase">Region</div>
        <div className="col-span-1 uppercase">PEAK Stage</div>
        <div className="col-span-1 uppercase text-right">MEDDPICC</div>
        <div className="col-span-1 uppercase text-right">Amount</div>
        <div className="col-span-1 uppercase text-right">Actions</div>
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
                  {/* Opportunity */}
                  <div className="sm:col-span-3 flex items-center min-w-0">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {opportunity.name[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate" title={opportunity.name}>
                        <Link href={`/opportunities/${opportunity.id}`} className="hover:underline" title={opportunity.name}>
                          {opportunity.name}
                        </Link>
                      </div>
                      {/* Mobile-only: show account under name */}
                      <div className="text-xs text-gray-500 sm:hidden truncate" title={opportunity.company?.name || '—'}>
                        {opportunity.company?.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Account */}
                  <div className="hidden sm:block sm:col-span-2 text-sm text-gray-700 min-w-0">
                    <div className="truncate" title={opportunity.company?.name || '—'}>
                      {opportunity.company?.name || '—'}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="sm:col-span-2 text-sm text-gray-700 whitespace-nowrap truncate" title={(() => {
                    const ownerId = (opportunity as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to || ''
                    return ownerId ? (ownersMap[ownerId] || ownerId) : '—'
                  })()}>
                    {(() => {
                      const ownerId = (opportunity as Partial<OpportunityWithDetails> & { assigned_to?: string | null }).assigned_to || ''
                      return ownerId ? (ownersMap[ownerId] || ownerId) : '—'
                    })()}
                  </div>

                  {/* Region */}
                  <div className="sm:col-span-1 text-sm text-gray-700 whitespace-nowrap truncate" title={getRegion(opportunity) || '—'}>
                    {getRegion(opportunity) || '—'}
                  </div>

                  {/* PEAK Stage */}
                  <div className="sm:col-span-1 whitespace-nowrap">
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
                  <div className="sm:col-span-1 text-right whitespace-nowrap" title={formatCurrency(opportunity.deal_value)}>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(opportunity.deal_value)}
                    </div>
                    {opportunity.probability && (
                      <div className="text-xs text-gray-500">{opportunity.probability}% prob.</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-1 flex items-center justify-end space-x-2 whitespace-nowrap">
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                      aria-label={`View details for ${opportunity.name}`}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/opportunities/${opportunity.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label={`Edit ${opportunity.name}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(opportunity.id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label={`Delete ${opportunity.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="p-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
