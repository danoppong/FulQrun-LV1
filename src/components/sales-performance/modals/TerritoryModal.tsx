'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react';

interface TerritoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  territory?: unknown
  organizationId: string
  users: unknown[]
}

export function TerritoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  territory, 
  organizationId,
  users 
}: TerritoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    zip_codes: '',
    industry_codes: '',
    revenue_tier_min: '',
    revenue_tier_max: '',
    assigned_user_id: '',
    manager_id: ''
  })

  useEffect(() => {
    if (territory) {
      setFormData({
        name: territory.name || '',
        description: territory.description || '',
        region: territory.region || '',
        zip_codes: territory.zip_codes?.join(', ') || '',
        industry_codes: territory.industry_codes?.join(', ') || '',
        revenue_tier_min: territory.revenue_tier_min || '',
        revenue_tier_max: territory.revenue_tier_max || '',
        assigned_user_id: territory.assigned_user_id || '',
        manager_id: territory.manager_id || ''
      })
    }
  }, [territory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        zip_codes: formData.zip_codes ? formData.zip_codes.split(',').map(z => z.trim()) : [],
        industry_codes: formData.industry_codes ? formData.industry_codes.split(',').map(i => i.trim()) : [],
        revenue_tier_min: formData.revenue_tier_min ? parseFloat(formData.revenue_tier_min) : null,
        revenue_tier_max: formData.revenue_tier_max ? parseFloat(formData.revenue_tier_max) : null,
        assigned_user_id: formData.assigned_user_id || null,
        manager_id: formData.manager_id || null
      }

      const url = territory 
        ? `/api/sales-performance/territories/${territory.id}`
        : '/api/sales-performance/territories'
      
      const method = territory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save territory')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {territory ? 'Edit Territory' : 'Create Territory'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Territory Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Northeast, West Coast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Codes (comma-separated)
              </label>
              <input
                type="text"
                value={formData.zip_codes}
                onChange={(e) => setFormData({ ...formData, zip_codes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10001, 10002, 10003"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry Codes (comma-separated)
            </label>
            <input
              type="text"
              value={formData.industry_codes}
              onChange={(e) => setFormData({ ...formData, industry_codes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TECH, RETAIL, HEALTHCARE"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue Tier Min ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.revenue_tier_min}
                onChange={(e) => setFormData({ ...formData, revenue_tier_min: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue Tier Max ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.revenue_tier_max}
                onChange={(e) => setFormData({ ...formData, revenue_tier_max: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <select
                value={formData.assigned_user_id}
                onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select User --</option>
                {users.filter(u => u.role === 'rep').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Manager --</option>
                {users.filter(u => u.role === 'manager' || u.role === 'admin').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : territory ? 'Update Territory' : 'Create Territory'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}








