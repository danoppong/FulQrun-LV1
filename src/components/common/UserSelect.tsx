'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUserProfiles } from '@/hooks/useUserProfiles'

type MinimalUser = { id: string; full_name: string | null; role?: string; region?: string | null; country?: string | null }

export interface UserSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowEmpty?: boolean
  emptyLabel?: string
  label?: string
  className?: string
  variant?: 'stacked' | 'combo'
}

export function UserSelect({
  value,
  onChange,
  placeholder = 'Search users',
  allowEmpty = true,
  emptyLabel = 'None',
  label,
  className,
  variant = 'stacked',
}: UserSelectProps) {
  const [search, setSearch] = useState('')
  const [extra, setExtra] = useState<MinimalUser | null>(null)
  const { data: users, loading } = useUserProfiles({ search, limit: 200, includeRegions: true })
  const [open, setOpen] = useState(false)

  // Ensure the currently selected user appears in options even if not in search results
  useEffect(() => {
    let canceled = false
    const ensure = async () => {
      if (!value) { setExtra(null); return }
      if (users?.some(u => u.id === value)) { setExtra(null); return }
      try {
        const res = await fetch(`/api/user-profiles/${value}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load user')
        const u = json?.data as MinimalUser | undefined
        if (!canceled) setExtra(u ?? null)
      } catch {
        if (!canceled) setExtra(null)
      }
    }
    void ensure()
    return () => { canceled = true }
  }, [value, users])

  const options = useMemo(() => {
    const list: MinimalUser[] = [...(users || [])]
    if (extra && !list.some(u => u.id === extra.id)) list.unshift(extra)
    return list
  }, [users, extra])

  // Helper to format how a user appears in the UI
  const formatUser = (u: MinimalUser | null | undefined) => {
    if (!u) return ''
    const suffix = u.region || u.country ? ` – ${[u.region, u.country].filter(Boolean).join(', ')}` : ''
    return (u.full_name || 'Unnamed user') + suffix
  }

  if (variant === 'combo') {
  const selectedUser = value ? options.find(u => u.id === value) || extra : null
  const listboxId = 'userselect-listbox'
    const displayValue = search || formatUser(selectedUser)
    return (
      <div className={`relative ${className ?? ''}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
  { /* Avoid extra top margin when there's no label to align with sibling selects */ }
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); if (!search && selectedUser) setSearch(formatUser(selectedUser)) }}
          onBlur={() => { setTimeout(() => setOpen(false), 150) }}
          placeholder={value ? undefined : (placeholder || 'Search users')}
          className={`${label ? 'mt-1' : ''} block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-2`}
          aria-autocomplete="list"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
        />
        {open && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto"
          >
            {allowEmpty && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(''); setSearch(''); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === '' ? 'bg-gray-50' : ''}`}
              >
                {emptyLabel}
              </button>
            )}
            {options.map(u => (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={u.id === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(u.id); setSearch(formatUser(u)); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${u.id === value ? 'bg-gray-50' : ''}`}
              >
                {formatUser(u)}
              </button>
            ))}
            {loading && (
              <div className="px-3 py-2 text-xs text-gray-500">Loading users…</div>
            )}
            {!loading && options.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">No users found</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="mt-1 mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-2"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base p-3"
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map(u => {
          const suffix = u.region || u.country ? ` – ${[u.region, u.country].filter(Boolean).join(', ')}` : ''
          return (
            <option key={u.id} value={u.id}>
              {(u.full_name || 'Unnamed user') + suffix}
            </option>
          )
        })}
      </select>
      {loading && <div className="text-xs text-gray-500 mt-1">Loading users…</div>}
    </div>
  )
}

export default UserSelect
