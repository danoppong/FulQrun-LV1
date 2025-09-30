'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CompensationManagementProps {
  organizationId: string
  user: any
}

interface CompensationPlan {
  id: string
  name: string
  description: string
  plan_type: string
  base_salary: number
  commission_rate: number
  commission_cap: number
  bonus_thresholds: Record<string, number>
  product_weightings: Record<string, number>
  territory_id: string
  user_id: string
  territory?: {
    name: string
    region: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
  commission_calculations: any[]
}

export function CompensationManagement({ organizationId, user }: CompensationManagementProps) {
  const [compensationPlans, setCompensationPlans] = useState<CompensationPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchCompensationPlans()
  }, [organizationId])

  const fetchCompensationPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-performance/compensation-plans?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setCompensationPlans(data)
      }
    } catch (error) {
      console.error('Error fetching compensation plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageCompensation = ['manager', 'admin'].includes(user?.profile?.role)

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'commission_only': return 'bg-red-100 text-red-800'
      case 'salary_plus_commission': return 'bg-blue-100 text-blue-800'
      case 'bonus_based': return 'bg-green-100 text-green-800'
      case 'hybrid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCommissionRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Compensation Management</h2>
        {canManageCompensation && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Compensation Plan
          </Button>
        )}
      </div>

      {/* Compensation Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compensationPlans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
                  {plan.plan_type.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assigned To:</span>
                  <span className="text-sm font-medium">
                    {plan.user?.full_name || 'Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Territory:</span>
                  <span className="text-sm font-medium">
                    {plan.territory?.name || 'No Territory'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Salary:</span>
                  <span className="text-sm font-medium">
                    ${plan.base_salary.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Commission Rate:</span>
                  <span className="text-sm font-medium">
                    {formatCommissionRate(plan.commission_rate)}
                  </span>
                </div>

                {plan.commission_cap && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commission Cap:</span>
                    <span className="text-sm font-medium">
                      ${plan.commission_cap.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Bonus Thresholds */}
              {plan.bonus_thresholds && Object.keys(plan.bonus_thresholds).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Bonus Thresholds</h4>
                  <div className="space-y-1">
                    {Object.entries(plan.bonus_thresholds).map(([threshold, multiplier]) => (
                      <div key={threshold} className="flex justify-between text-sm">
                        <span className="text-gray-600">{threshold}% Quota:</span>
                        <span className="font-medium">{multiplier}x Multiplier</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Weightings */}
              {plan.product_weightings && Object.keys(plan.product_weightings).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Product Weightings</h4>
                  <div className="space-y-1">
                    {Object.entries(plan.product_weightings).map(([product, weight]) => (
                      <div key={product} className="flex justify-between text-sm">
                        <span className="text-gray-600">{product}:</span>
                        <span className="font-medium">{formatCommissionRate(weight)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commission Calculations */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission Records:</span>
                  <span className="font-medium">{plan.commission_calculations?.length || 0}</span>
                </div>
              </div>

              {canManageCompensation && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Calculations
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {compensationPlans.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No compensation plans found</div>
          <p className="text-gray-400 mt-2">
            {canManageCompensation 
              ? 'Create your first compensation plan to get started'
              : 'Compensation plans will appear here once they are created'
            }
          </p>
        </div>
      )}
    </div>
  )
}
