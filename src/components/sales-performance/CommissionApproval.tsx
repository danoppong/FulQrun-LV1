'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CommissionApprovalProps {
  organizationId: string
  user: any
}

interface CommissionCalculation {
  id: string
  user_id: string
  compensation_plan_id: string
  period_start: string
  period_end: string
  base_salary: number
  commission_earned: number
  bonus_earned: number
  total_compensation: number
  quota_attainment: number
  commission_rate_applied: number
  adjustments: Record<string, any>
  status: string
  approved_by: string
  approved_at: string
  payroll_exported: boolean
  payroll_export_date: string
  user: {
    id: string
    full_name: string
    email: string
  }
  compensation_plan: {
    name: string
    plan_type: string
    commission_rate: number
  }
  approved_by_user?: {
    id: string
    full_name: string
    email: string
  }
}

export function CommissionApproval({ organizationId, user }: CommissionApprovalProps) {
  const [calculations, setCalculations] = useState<CommissionCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('pending')

  useEffect(() => {
    fetchCommissionCalculations()
  }, [organizationId, selectedStatus])

  const fetchCommissionCalculations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        status: selectedStatus
      })

      const response = await fetch(`/api/sales-performance/commission-calculations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCalculations(data)
      }
    } catch (error) {
      console.error('Error fetching commission calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const canApproveCommissions = ['manager', 'admin'].includes(user?.profile?.role)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'disputed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleApproveCommission = async (calculationId: string) => {
    try {
      const response = await fetch('/api/sales-performance/commission-calculations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: calculationId,
          status: 'approved'
        })
      })

      if (response.ok) {
        fetchCommissionCalculations() // Refresh the list
      }
    } catch (error) {
      console.error('Error approving commission:', error)
    }
  }

  const handleRejectCommission = async (calculationId: string) => {
    try {
      const response = await fetch('/api/sales-performance/commission-calculations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: calculationId,
          status: 'disputed'
        })
      })

      if (response.ok) {
        fetchCommissionCalculations() // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting commission:', error)
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Commission Approval</h2>
        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={fetchCommissionCalculations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Commission Calculations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculations.map((calculation) => (
          <Card key={calculation.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {calculation.user.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">{calculation.compensation_plan.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(calculation.status)}`}>
                  {calculation.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Period:</span>
                  <span className="text-sm font-medium">
                    {new Date(calculation.period_start).toLocaleDateString()} - {new Date(calculation.period_end).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Salary:</span>
                  <span className="text-sm font-medium">
                    ${calculation.base_salary.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Commission Earned:</span>
                  <span className="text-sm font-medium">
                    ${calculation.commission_earned.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bonus Earned:</span>
                  <span className="text-sm font-medium">
                    ${calculation.bonus_earned.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between font-semibold">
                  <span className="text-sm text-gray-900">Total Compensation:</span>
                  <span className="text-sm text-gray-900">
                    ${calculation.total_compensation.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quota Attainment:</span>
                    <span className="font-medium">{(calculation.quota_attainment * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="font-medium">{(calculation.commission_rate_applied * 100).toFixed(2)}%</span>
                  </div>
                  {calculation.payroll_exported && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payroll Exported:</span>
                      <span className="font-medium text-green-600">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Adjustments */}
              {calculation.adjustments && Object.keys(calculation.adjustments).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Adjustments</h4>
                  <div className="space-y-1">
                    {Object.entries(calculation.adjustments).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              {canApproveCommissions && calculation.status === 'pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveCommission(calculation.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleRejectCommission(calculation.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {calculation.approved_by_user && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Approved by: {calculation.approved_by_user.full_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Approved on: {new Date(calculation.approved_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {calculations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No commission calculations found</div>
          <p className="text-gray-400 mt-2">
            Commission calculations will appear here once they are generated
          </p>
        </div>
      )}
    </div>
  )
}
