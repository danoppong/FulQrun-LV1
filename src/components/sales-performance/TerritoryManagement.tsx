'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button';

interface TerritoryManagementProps {
  organizationId: string
  user: unknown
}

interface Territory {
  id: string
  name: string
  description: string
  region: string
  zip_codes: string[]
  industry_codes: string[]
  revenue_tier_min: number
  revenue_tier_max: number
  assigned_user_id: string
  manager_id: string
  assigned_user?: {
    id: string
    full_name: string
    email: string
  }
  manager?: {
    id: string
    full_name: string
    email: string
  }
  quota_plans: unknown[]
  compensation_plans: unknown[]
}

export function TerritoryManagement({ organizationId, user }: TerritoryManagementProps) {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchTerritories()
  }, [organizationId])

  const fetchTerritories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-performance/territories?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setTerritories(data)
      }
    } catch (error) {
      console.error('Error fetching territories:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageTerritories = ['manager', 'admin'].includes(user?.profile?.role)

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
        <h2 className="text-2xl font-bold text-gray-900">Territory Management</h2>
        {canManageTerritories && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Territory
          </Button>
        )}
      </div>

      {/* Territories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {territories.map((territory) => (
          <Card key={territory.id} className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{territory.name}</h3>
                <p className="text-sm text-gray-600">{territory.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Region:</span>
                  <span className="text-sm font-medium">{territory.region || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assigned To:</span>
                  <span className="text-sm font-medium">
                    {territory.assigned_user?.full_name || 'Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className="text-sm font-medium">
                    {territory.manager?.full_name || 'N/A'}
                  </span>
                </div>

                {territory.revenue_tier_min && territory.revenue_tier_max && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue Tier:</span>
                    <span className="text-sm font-medium">
                      ${territory.revenue_tier_min.toLocaleString()} - ${territory.revenue_tier_max.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zip Codes:</span>
                  <span className="text-sm font-medium">{territory.zip_codes?.length || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Industry Codes:</span>
                  <span className="text-sm font-medium">{territory.industry_codes?.length || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quota Plans:</span>
                  <span className="font-medium">{territory.quota_plans?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Compensation Plans:</span>
                  <span className="font-medium">{territory.compensation_plans?.length || 0}</span>
                </div>
              </div>

              {canManageTerritories && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Assign
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {territories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No territories found</div>
          <p className="text-gray-400 mt-2">
            {canManageTerritories 
              ? 'Create your first territory to get started'
              : 'Territories will appear here once they are created'
            }
          </p>
        </div>
      )}
    </div>
  )
}
