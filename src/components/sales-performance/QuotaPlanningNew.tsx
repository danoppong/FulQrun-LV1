'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuotaPlanModal } from './modals/QuotaPlanModal'
import { Target, TrendingUp, CheckCircle, Clock, Edit, Trash2, Plus, GitBranch } from 'lucide-react'

interface QuotaPlanningNewProps {
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
  parent_plan_id: string
  planning_method: string
  planning_level: string
  is_reconciled: boolean
  is_approved: boolean
  territory?: {
    name: string
    region: string
  }
  user?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  approved_by_user?: {
    full_name: string
  }
  performance_metrics: any[]
  child_plans?: QuotaPlan[]
}

export function QuotaPlanningNew({ organizationId, user }: QuotaPlanningNewProps) {
  const [quotaPlans, setQuotaPlans] = useState<QuotaPlan[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [territories, setTerritories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<QuotaPlan | undefined>()
  const [viewMode, setViewMode] = useState<'hierarchy' | 'list'>('list')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active')

  useEffect(() => {
    fetchQuotaPlans()
    fetchUsers()
    fetchTerritories()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTerritories = async () => {
    try {
      const response = await fetch(`/api/sales-performance/territories?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setTerritories(data)
      }
    } catch (error) {
      console.error('Error fetching territories:', error)
    }
  }

  const handleCreate = () => {
    setSelectedPlan(undefined)
    setShowModal(true)
  }

  const handleEdit = (plan: QuotaPlan) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this quota plan? This will also delete all child plans.')) return

    try {
      const response = await fetch(`/api/sales-performance/quota-plans/${planId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchQuotaPlans()
      } else {
        alert('Failed to delete quota plan')
      }
    } catch (error) {
      console.error('Error deleting quota plan:', error)
      alert('Error deleting quota plan')
    }
  }

  const handleApprove = async (planId: string) => {
    if (!confirm('Are you sure you want to approve this quota plan?')) return

    try {
      const response = await fetch(`/api/sales-performance/quota-plans/${planId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchQuotaPlans()
      } else {
        alert('Failed to approve quota plan')
      }
    } catch (error) {
      console.error('Error approving quota plan:', error)
      alert('Error approving quota plan')
    }
  }

  const handleSuccess = () => {
    fetchQuotaPlans()
  }

  const canManagePlans = ['manager', 'admin'].includes(user?.profile?.role)

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'annual': return 'bg-blue-100 text-blue-800'
      case 'quarterly': return 'bg-green-100 text-green-800'
      case 'monthly': return 'bg-yellow-100 text-yellow-800'
      case 'custom': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanningMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      'top_down': 'bg-blue-100 text-blue-800',
      'bottom_up': 'bg-green-100 text-green-800',
      'middle_out': 'bg-purple-100 text-purple-800',
      'direct': 'bg-gray-100 text-gray-800'
    }
    return colors[method] || 'bg-gray-100 text-gray-800'
  }

  const getPlanningLevelIcon = (level: string) => {
    const levels: Record<string, string> = {
      'executive': '👔',
      'director': '📊',
      'manager': '🎯',
      'team': '👥',
      'individual': '👤'
    }
    return levels[level] || '📋'
  }

  const calculateProgress = (plan: QuotaPlan) => {
    const now = new Date()
    const startDate = new Date(plan.start_date)
    const endDate = new Date(plan.end_date)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  }

  const getPlanStatus = (plan: QuotaPlan) => {
    const now = new Date()
    const startDate = new Date(plan.start_date)
    const endDate = new Date(plan.end_date)
    
    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'active'
  }

  const filteredPlans = quotaPlans.filter(plan => {
    const status = getPlanStatus(plan)
    if (filterStatus === 'all') return true
    return status === filterStatus
  })

  // Build hierarchy for hierarchy view
  const buildHierarchy = (plans: QuotaPlan[]): QuotaPlan[] => {
    const planMap = new Map(plans.map(p => [p.id, { ...p, child_plans: [] }]))
    const roots: QuotaPlan[] = []

    plans.forEach(plan => {
      const planWithChildren = planMap.get(plan.id)!
      if (plan.parent_plan_id) {
        const parent = planMap.get(plan.parent_plan_id)
        if (parent) {
          parent.child_plans = parent.child_plans || []
          parent.child_plans.push(planWithChildren)
        }
      } else {
        roots.push(planWithChildren)
      }
    })

    return roots
  }

  const hierarchicalPlans = viewMode === 'hierarchy' ? buildHierarchy(filteredPlans) : []

  // Calculate statistics
  const stats = {
    total: quotaPlans.length,
    active: quotaPlans.filter(p => getPlanStatus(p) === 'active').length,
    approved: quotaPlans.filter(p => p.is_approved).length,
    totalRevenue: quotaPlans.reduce((sum, p) => sum + p.target_revenue, 0),
    avgProgress: quotaPlans.filter(p => getPlanStatus(p) === 'active').reduce((sum, p) => sum + calculateProgress(p), 0) / quotaPlans.filter(p => getPlanStatus(p) === 'active').length || 0
  }

  const renderPlanCard = (plan: QuotaPlan, depth = 0) => {
    const progress = calculateProgress(plan)
    const status = getPlanStatus(plan)
    const isActive = status === 'active'
    const isUpcoming = status === 'upcoming'
    const isCompleted = status === 'completed'

    return (
      <div key={plan.id} style={{ marginLeft: depth * 24 }}>
        <Card className={`p-6 mb-4 ${depth > 0 ? 'border-l-4 border-blue-300' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getPlanningLevelIcon(plan.planning_level)}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  {plan.parent_plan_id && (
                    <GitBranch size={16} className="text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
                  {plan.plan_type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanningMethodBadge(plan.planning_method)}`}>
                  {plan.planning_method.replace('_', ' ')}
                </span>
                {canManagePlans && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Planning Level</p>
                <p className="text-sm font-medium capitalize">{plan.planning_level}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Assigned To</p>
                <p className="text-sm font-medium">
                  {plan.user?.full_name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Territory</p>
                <p className="text-sm font-medium">
                  {plan.territory?.name || 'No Territory'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Period</p>
                <p className="text-sm font-medium">
                  {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">Revenue Target</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${(plan.target_revenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Deals Target</p>
                <p className="text-lg font-semibold text-green-600">
                  {plan.target_deals}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Activities Target</p>
                <p className="text-lg font-semibold text-purple-600">
                  {plan.target_activities}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isActive && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Time Progress</span>
                  <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-800' :
                isUpcoming ? 'bg-blue-100 text-blue-800' :
                isCompleted ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? '🟢 Active' : isUpcoming ? '🔵 Upcoming' : isCompleted ? '⚫ Completed' : 'Inactive'}
              </span>
              
              {plan.is_reconciled && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ✓ Reconciled
                </span>
              )}
              
              {plan.is_approved ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Approved by {plan.approved_by_user?.full_name || 'Manager'}
                </span>
              ) : canManagePlans && (
                <button
                  onClick={() => handleApprove(plan.id)}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  ⏳ Pending Approval
                </button>
              )}
              
              {plan.performance_metrics?.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  📊 {plan.performance_metrics.length} Metrics
                </span>
              )}
            </div>
          </div>
        </Card>
        
        {/* Render child plans */}
        {plan.child_plans && plan.child_plans.length > 0 && (
          <div className="ml-6">
            {plan.child_plans.map(childPlan => renderPlanCard(childPlan, depth + 1))}
          </div>
        )}
      </div>
    )
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quota Planning</h2>
          <p className="text-gray-600 mt-1">Hierarchical target planning with Top-Down/Bottom-Up/Middle-Out reconciliation</p>
        </div>
        {canManagePlans && (
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Create Quota Plan
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Target</p>
              <p className="text-xl font-bold">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-xl font-bold">{stats.avgProgress.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All ({quotaPlans.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Active ({quotaPlans.filter(p => getPlanStatus(p) === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Upcoming ({quotaPlans.filter(p => getPlanStatus(p) === 'upcoming').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Completed ({quotaPlans.filter(p => getPlanStatus(p) === 'completed').length})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-2 rounded ${viewMode === 'hierarchy' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Hierarchy View
          </button>
        </div>
      </div>

      {/* Plans List/Hierarchy */}
      {viewMode === 'list' ? (
        <div>
          {filteredPlans.map(plan => renderPlanCard(plan))}
        </div>
      ) : (
        <div>
          {hierarchicalPlans.map(plan => renderPlanCard(plan))}
        </div>
      )}

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quota plans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManagePlans 
              ? 'Get started by creating your first quota plan'
              : 'Quota plans will appear here once they are created'
            }
          </p>
          {canManagePlans && (
            <div className="mt-6">
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus size={18} /> Create Quota Plan
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quota Plan Modal */}
      <QuotaPlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        quotaPlan={selectedPlan}
        organizationId={organizationId}
        users={users}
        territories={territories}
        parentPlans={quotaPlans.filter(p => !p.parent_plan_id)} // Only top-level plans can be parents
      />
    </div>
  )
}






