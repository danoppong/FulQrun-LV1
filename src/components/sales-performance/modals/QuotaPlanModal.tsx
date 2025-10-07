'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react';

interface QuotaPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  quotaPlan?: any
  organizationId: string
  users: unknown[]
  territories: unknown[]
  parentPlans?: unknown[]
}

export function QuotaPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  quotaPlan, 
  organizationId,
  users,
  territories,
  parentPlans = []
}: QuotaPlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'monthly',
    start_date: '',
    end_date: '',
    target_revenue: '',
    target_deals: '',
    target_activities: '',
    territory_id: '',
    user_id: '',
    parent_plan_id: '',
    planning_method: 'direct',
    planning_level: 'individual'
  })

  useEffect(() => {
    if (quotaPlan) {
      setFormData({
        name: quotaPlan.name || '',
        description: quotaPlan.description || '',
        plan_type: quotaPlan.plan_type || 'monthly',
        start_date: quotaPlan.start_date || '',
        end_date: quotaPlan.end_date || '',
        target_revenue: quotaPlan.target_revenue || '',
        target_deals: quotaPlan.target_deals || '',
        target_activities: quotaPlan.target_activities || '',
        territory_id: quotaPlan.territory_id || '',
        user_id: quotaPlan.user_id || '',
        parent_plan_id: quotaPlan.parent_plan_id || '',
        planning_method: quotaPlan.planning_method || 'direct',
        planning_level: quotaPlan.planning_level || 'individual'
      })
    } else {
      // Set default dates for new plans
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      setFormData(prev => ({
        ...prev,
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0]
      }))
    }
  }, [quotaPlan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        target_revenue: parseFloat(formData.target_revenue) || 0,
        target_deals: parseInt(formData.target_deals) || 0,
        target_activities: parseInt(formData.target_activities) || 0,
        territory_id: formData.territory_id || null,
        user_id: formData.user_id || null,
        parent_plan_id: formData.parent_plan_id || null
      }

      const url = quotaPlan 
        ? `/api/sales-performance/quota-plans/${quotaPlan.id}`
        : '/api/sales-performance/quota-plans'
      
      const method = quotaPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save quota plan')
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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {quotaPlan ? 'Edit Quota Plan' : 'Create Quota Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name *
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
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type *
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Targets</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue Target ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_revenue}
                  onChange={(e) => setFormData({ ...formData, target_revenue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deals Target
                </label>
                <input
                  type="number"
                  value={formData.target_deals}
                  onChange={(e) => setFormData({ ...formData, target_deals: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activities Target
                </label>
                <input
                  type="number"
                  value={formData.target_activities}
                  onChange={(e) => setFormData({ ...formData, target_activities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Hierarchical Planning */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Planning Structure</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planning Method
                </label>
                <select
                  value={formData.planning_method}
                  onChange={(e) => setFormData({ ...formData, planning_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="direct">Direct</option>
                  <option value="top_down">Top-Down</option>
                  <option value="bottom_up">Bottom-Up</option>
                  <option value="middle_out">Middle-Out</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How targets cascade through the organization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planning Level
                </label>
                <select
                  value={formData.planning_level}
                  onChange={(e) => setFormData({ ...formData, planning_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                  <option value="executive">Executive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Organizational level of this plan
                </p>
              </div>
            </div>

            {parentPlans.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Plan (Optional)
                </label>
                <select
                  value={formData.parent_plan_id}
                  onChange={(e) => setFormData({ ...formData, parent_plan_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- None (Top Level) --</option>
                  {parentPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.planning_level})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Link to parent plan for hierarchical planning
                </p>
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Assignments</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To User
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select User --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Territory
                </label>
                <select
                  value={formData.territory_id}
                  onChange={(e) => setFormData({ ...formData, territory_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Territory --</option>
                  {territories.map((territory) => (
                    <option key={territory.id} value={territory.id}>
                      {territory.name} ({territory.region})
                    </option>
                  ))}
                </select>
              </div>
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
              {loading ? 'Saving...' : quotaPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}







