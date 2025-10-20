"use client"
import { useCallback, useEffect, useState } from 'react'
import type { UserProfile, UpdateUserProfileInput } from '@/lib/types/user-profile'
import { userProfilesService } from '@/lib/services/user-profiles'

export function useCurrentUserProfile() {
  const [data, setData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await userProfilesService.getMe()
    if (error) setError(error.message)
    setData(data)
    setLoading(false)
  }, [])

  const update = useCallback(async (input: UpdateUserProfileInput) => {
    const { error } = await userProfilesService.updateMe(input)
    if (error) throw error
    await refresh()
  }, [refresh])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh, update }
}
