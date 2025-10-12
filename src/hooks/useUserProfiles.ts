"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UserProfile } from '@/lib/types/user-profile'
import { userProfilesService } from '@/lib/services/user-profiles'

function useDebounce<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  const timeoutRef = useRef<number | null>(null)
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setDebounced(value), delay)
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }
  }, [value, delay])
  return debounced
}

export function useUserProfiles(params?: { search?: string; limit?: number; includeRegions?: boolean }) {
  const [data, setData] = useState<Array<Pick<UserProfile, 'id' | 'full_name' | 'role'>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debouncedSearch = useDebounce(params?.search, 250)
  const limit = params?.limit
  const includeRegions = params?.includeRegions ?? false

  const key = useMemo(() => JSON.stringify({ search: debouncedSearch || '', limit: limit || 100, includeRegions }), [debouncedSearch, limit, includeRegions])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await userProfilesService.listOrgUsers({ search: debouncedSearch, limit, includeRegions })
    if (error) setError(error.message)
    setData(data)
    setLoading(false)
  }, [debouncedSearch, limit, includeRegions])

  useEffect(() => { void refresh() }, [refresh, key])

  return { data, loading, error, refresh }
}
