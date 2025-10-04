'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, Trash2 } from 'lucide-react'

interface CompensationPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  compensationPlan?: any
  organizationId: string
  users: any[]
  territories: any[]
}

export function CompensationPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  compensationPlan, 
  organizationId,
  users,
  territories
}: CompensationPlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'salary_plus_commission',
    base_salary: '',
    commission_rate: '',
    commission_cap: '',
    territory_id: '',
    user_id: ''
  })
  const [bonusThresholds, setBonusThresholds] = useState<Array<{ threshold: string, multiplier: string }>>([])
  const [productWeightings, setProductWeightings] = useState<Array<{ product: string, rate: string }>>([])

  useEffect(() => {
    if (compensationPlan) {
      setFormData({
        name: compensationPlan.name || '',
        description: compensationPlan.description || '',
        plan_type: compensationPlan.plan_type || 'salary_plus_commission',
        base_salary: compensationPlan.base_salary || '',
        commission_rate: (compensationPlan.commission_rate * 100) || '', // Convert to percentage
        commission_cap: compensationPlan.commission_cap || '',
        territory_id: compensationPlan.territory_id || '',
        user_id: compensationPlan.user_id || ''
      })

      // Parse bonus thresholds
      if (compensationPlan.bonus_thresholds && typeof compensationPlan.bonus_thresholds === 'object') {
        const thresholds = Object.entries(compensationPlan.bonus_thresholds).map(([threshold, multiplier]) => ({
          threshold,
          multiplier: String(multiplier)
        }))
        setBonusThresholds(thresholds)
      }

      // Parse product weightings
      if (compensationPlan.product_weightings && typeof compensationPlan.product_weightings === 'object') {
        const weightings = Object.entries(compensationPlan.product_weightings).map(([product, rate]) => ({
          product,
          rate: String((rate as number) * 100) // Convert to percentage
        }))
        setProductWeightings(weightings)
      }
    }
  }, [compensationPlan])

  const addBonusThreshold = () => {
    setBonusThresholds([...bonusThresholds, { threshold: '', multiplier: '' }])
  }

  const removeBonusThreshold = (index: number) => {
    setBonusThresholds(bonusThresholds.filter((_, i) => i !== index))
  }

  const updateBonusThreshold = (index: number, field: 'threshold' | 'multiplier', value: string) => {
    const updated = [...bonusThresholds]
    updated[index][field] = value
    setBonusThresholds(updated)
  }

  const addProductWeighting = () => {
    setProductWeightings([...productWeightings, { product: '', rate: '' }])
  }

  const removeProductWeighting = (index: number) => {
    setProductWeightings(productWeightings.filter((_, i) => i !== index))
  }

  const updateProductWeighting = (index: number, field: 'product' | 'rate', value: string) => {
    const updated = [...productWeightings]
    updated[index][field] = value
    setProductWeightings(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Convert bonus thresholds to object
      const bonusThresholdsObj: Record<string, number> = {}
      bonusThresholds.forEach(({ threshold, multiplier }) => {
        if (threshold && multiplier) {
          bonusThresholdsObj[threshold] = parseFloat(multiplier)
        }
      })

      // Convert product weightings to object (percentage to decimal)
      const productWeightingsObj: Record<string, number> = {}
      productWeightings.forEach(({ product, rate }) => {
        if (product && rate) {
          productWeightingsObj[product] = parseFloat(rate) / 100
        }
      })

      const payload = {
        ...formData,
        base_salary: parseFloat(formData.base_salary) || 0,
        commission_rate: parseFloat(formData.commission_rate) / 100 || 0, // Convert percentage to decimal
        commission_cap: formData.commission_cap ? parseFloat(formData.commission_cap) : null,
        bonus_thresholds: bonusThresholdsObj,
        product_weightings: productWeightingsObj,
        territory_id: formData.territory_id || null,
        user_id: formData.user_id || null
      }

      const url = compensationPlan 
        ? `/api/sales-performance/compensation-plans/${compensationPlan.id}`
        : '/api/sales-performance/compensation-plans'
      
      const method = compensationPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save compensation plan')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {compensationPlan ? 'Edit Compensation Plan' : 'Create Compensation Plan'}
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
                <option value="commission_only">Commission Only</option>
                <option value="salary_plus_commission">Salary + Commission</option>
                <option value="bonus_based">Bonus Based</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Compensation Structure */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Compensation Structure</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Salary ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Cap ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commission_cap}
                  onChange={(e) => setFormData({ ...formData, commission_cap: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Bonus Thresholds */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-medium text-gray-900">Banded Bonus Thresholds</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addBonusThreshold}
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Add Threshold
              </Button>
            </div>
            
            {bonusThresholds.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No bonus thresholds defined</p>
            ) : (
              <div className="space-y-2">
                {bonusThresholds.map((bonus, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={bonus.threshold}
                        onChange={(e) => updateBonusThreshold(index, 'threshold', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Quota % (e.g., 100)"
                      />
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={bonus.multiplier}
                        onChange={(e) => updateBonusThreshold(index, 'multiplier', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Multiplier (e.g., 1.5)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBonusThreshold(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Weightings */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-medium text-gray-900">Product-Specific Weightings</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addProductWeighting}
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Add Product
              </Button>
            </div>
            
            {productWeightings.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No product weightings defined</p>
            ) : (
              <div className="space-y-2">
                {productWeightings.map((product, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={product.product}
                        onChange={(e) => updateProductWeighting(index, 'product', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Product Name"
                      />
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={product.rate}
                        onChange={(e) => updateProductWeighting(index, 'rate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Commission % (e.g., 7.5)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProductWeighting(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
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
              {loading ? 'Saving...' : compensationPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}





