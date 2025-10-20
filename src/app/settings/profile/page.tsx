'use client'
import { useEffect, useState } from 'react'
import { useUserProfiles } from '@/hooks/useUserProfiles'
import { UserSelect } from '@/components/common/UserSelect'

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [managerId, setManagerId] = useState('')
  const [region, setRegion] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const { data: _managers } = useUserProfiles({ search: undefined, limit: 200 })

  useEffect(() => {
    let canceled = false
    const run = async () => {
      try {
        const res = await fetch('/api/user-profiles/me')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load')
        if (canceled) return
  // setProfile(json.data)
  setFullName(json.data?.full_name ?? '')
  setManagerId(json.data?.manager_id ?? '')
  setRegion(json.data?.region ?? null)
  setCountry(json.data?.country ?? null)
      } catch (e: unknown) {
        if (!canceled) setError((e as Error).message)
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    run()
    return () => { canceled = true }
  }, [])

  // UserSelect handles selected option presence internally

  // Options handled by shared UserSelect component; extraManager retained for selected value persistence

  const onSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const res = await fetch('/api/user-profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName || null, manager_id: managerId || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Save failed')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading profile…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Full name</label>
        <input className="w-full border rounded px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Region</div>
          <div className="px-3 py-2 border rounded bg-gray-50 text-gray-700">{region || '—'}</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Country</div>
          <div className="px-3 py-2 border rounded bg-gray-50 text-gray-700">{country || '—'}</div>
        </div>
      </div>
      <div className="space-y-2">
        <UserSelect
          label="Manager (optional)"
          value={managerId}
          onChange={setManagerId}
          allowEmpty
          emptyLabel="No manager"
        />
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={onSave} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
