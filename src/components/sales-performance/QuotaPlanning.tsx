'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuotaPlanningProps {
  organizationId: string
  user: any
}

interface QuotaPlan {
  id: string
  name: string
  description: string
  plan_type: string
  start_date: string
  end_date: string
  target_revenue: number
  target_deals: number
  target_activities: number
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
  performance_metrics: any[]
}

export function QuotaPlanning({ organizationId, user }: QuotaPlanningProps) {
  const [quotaPlans, setQuotaPlans] = useState<QuotaPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchQuotaPlans()
  }, [organizationId])

  const fetchQuotaPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-performance/quota-plans?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setQuotaPlans(data)
      }
    } catch (error) {
      console.error('Error fetching quota plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageQuotas = ['manager', 'admin'].includes(user?.profile?.role)

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'annual': return 'bg-blue-100 text-blue-800'
      case 'quarterly': return 'bg-green-100 text-green-800'
      case 'monthly': return 'bg-yellow-100 text-yellow-800'
      case 'custom': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateProgress = (plan: QuotaPlan) => {
    const now = new Date()
    const startDate = new Date(plan.start_date)
    const endDate = new Date(plan.end_date)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
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
        <h2 className="text-2xl font-bold text-gray-900">Quota Planning</h2>
        {canManageQuotas && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Quota Plan
          </Button>
        )}
      </div>

      {/* Quota Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotaPlans.map((plan) => {
          const progress = calculateProgress(plan)
          const isActive = new Date() >= new Date(plan.start_date) && new Date() <= new Date(plan.end_date)
          const isUpcoming = new Date() < new Date(plan.start_date)
          const isCompleted = new Date() > new Date(plan.end_date)

          return (
            <Card key={plan.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
                    {plan.plan_type}
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
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="text-sm font-medium">
                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-green-600' :
                      isUpcoming ? 'text-blue-600' :
                      isCompleted ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                      {isActive ? 'Active' : isUpcoming ? 'Upcoming' : isCompleted ? 'Completed' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isActive ? 'bg-blue-500' :
                        isUpcoming ? 'bg-gray-400' :
                        isCompleted ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Targets */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenue Target:</span>
                      <span className="font-medium">${plan.target_revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deals Target:</span>
                      <span className="font-medium">{plan.target_deals}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Activities Target:</span>
                      <span className="font-medium">{plan.target_activities}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                {plan.performance_metrics && plan.performance_metrics.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance Records:</span>
                      <span className="font-medium">{plan.performance_metrics.length}</span>
                    </div>
                  </div>
                )}

                {canManageQuotas && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Metrics
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {quotaPlans.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No quota plans found</div>
          <p className="text-gray-400 mt-2">
            {canManageQuotas 
              ? 'Create your first quota plan to get started'
              : 'Quota plans will appear here once they are created'
            }
          </p>
        </div>
      )}
    </div>
  )
}
