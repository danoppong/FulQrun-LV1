import type { UserProfile, UpdateUserProfileInput } from '@/lib/types/user-profile'

export const userProfilesService = {
  async getMe(): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      const res = await fetch('/api/user-profiles/me', { headers: { 'Accept': 'application/json' } })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as unknown
        const msg = (err && typeof err === 'object' && 'error' in err) ? (err as { error?: string }).error : undefined
        return { data: null, error: new Error(msg || `GET /api/user-profiles/me ${res.status}`) }
      }
      const json = await res.json()
      return { data: (json?.data as UserProfile) ?? null, error: null }
    } catch (e) { return { data: null, error: e as Error } }
  },

  async updateMe(input: UpdateUserProfileInput): Promise<{ error: Error | null }> {
    try {
      const res = await fetch('/api/user-profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as unknown
        const msg = (err && typeof err === 'object' && 'error' in err) ? (err as { error?: string }).error : undefined
        return { error: new Error(msg || `PATCH /api/user-profiles/me ${res.status}`) }
      }
      return { error: null }
    } catch (e) { return { error: e as Error } }
  },

  async listOrgUsers(params?: { search?: string; limit?: number; includeRegions?: boolean }): Promise<{ data: Array<Pick<UserProfile, 'id' | 'full_name' | 'role' | 'region' | 'country' | 'business_unit'>>; error: Error | null }> {
    try {
      const qp = new URLSearchParams()
      if (params?.search) qp.set('search', params.search)
      if (params?.limit) qp.set('limit', String(params.limit))
      if (params?.includeRegions) qp.set('includeRegions', String(!!params.includeRegions))
      const res = await fetch(`/api/user-profiles${qp.size ? `?${qp.toString()}` : ''}`, { headers: { 'Accept': 'application/json' } })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as unknown
        const msg = (err && typeof err === 'object' && 'error' in err) ? (err as { error?: string }).error : undefined
        return { data: [], error: new Error(msg || `GET /api/user-profiles ${res.status}`) }
      }
      const json = await res.json()
      return { data: (json?.data as Array<Pick<UserProfile, 'id' | 'full_name' | 'role' | 'region' | 'country' | 'business_unit'>>) ?? [], error: null }
    } catch (e) { return { data: [], error: e as Error } }
  }
}
