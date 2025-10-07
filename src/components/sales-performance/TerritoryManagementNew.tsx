'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TerritoryModal } from './modals/TerritoryModal'
import { Map, Users, TrendingUp, Award, Edit, Trash2, Plus } from 'lucide-react';

interface TerritoryManagementNewProps {
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
  fairness_index: number
  territory_value: number
  account_count: number
  opportunity_count: number
  is_active: boolean
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

export function TerritoryManagementNew({ organizationId, user }: TerritoryManagementNewProps) {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | undefined>()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active')

  useEffect(() => {
    fetchTerritories()
    fetchUsers()
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

  const handleCreate = () => {
    setSelectedTerritory(undefined)
    setShowModal(true)
  }

  const handleEdit = (territory: Territory) => {
    setSelectedTerritory(territory)
    setShowModal(true)
  }

  const handleDelete = async (territoryId: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) return

    try {
      const response = await fetch(`/api/sales-performance/territories/${territoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTerritories()
      } else {
        alert('Failed to delete territory')
      }
    } catch (error) {
      console.error('Error deleting territory:', error)
      alert('Error deleting territory')
    }
  }

  const handleSuccess = () => {
    fetchTerritories()
  }

  const canManageTerritories = ['manager', 'admin'].includes(user?.profile?.role)

  const filteredTerritories = territories.filter(t => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return t.is_active
    if (filterStatus === 'inactive') return !t.is_active
    return true
  })

  const getFairnessColor = (fairnessIndex: number) => {
    if (fairnessIndex >= 0.8) return 'text-green-600'
    if (fairnessIndex >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFairnessLabel = (fairnessIndex: number) => {
    if (fairnessIndex >= 0.8) return 'Excellent'
    if (fairnessIndex >= 0.6) return 'Good'
    if (fairnessIndex >= 0.4) return 'Fair'
    return 'Needs Attention'
  }

  // Calculate statistics
  const stats = {
    total: territories.length,
    active: territories.filter(t => t.is_active).length,
    assigned: territories.filter(t => t.assigned_user_id).length,
    avgValue: territories.reduce((sum, t) => sum + (t.territory_value || 0), 0) / territories.length || 0,
    avgFairness: territories.reduce((sum, t) => sum + (t.fairness_index || 0), 0) / territories.length || 0
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
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Territory Management</h2>
          <p className="text-gray-600 mt-1">Dynamic assignment and fairness optimization</p>
        </div>
        {canManageTerritories && (
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Create Territory
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Map className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Territories</p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-2xl font-bold">{stats.assigned}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Value</p>
              <p className="text-xl font-bold">${(stats.avgValue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Fairness</p>
              <p className="text-xl font-bold">{(stats.avgFairness * 100).toFixed(0)}%</p>
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
            All ({territories.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Active ({territories.filter(t => t.is_active).length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Inactive ({territories.filter(t => !t.is_active).length})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Territories Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerritories.map((territory) => (
            <Card key={territory.id} className={`p-6 ${!territory.is_active ? 'opacity-60' : ''}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{territory.name}</h3>
                    <p className="text-sm text-gray-600">{territory.description}</p>
                  </div>
                  {canManageTerritories && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(territory)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(territory.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
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

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Territory Value:</span>
                    <span className="text-sm font-medium">
                      ${(territory.territory_value || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Accounts:</span>
                    <span className="text-sm font-medium">{territory.account_count || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Opportunities:</span>
                    <span className="text-sm font-medium">{territory.opportunity_count || 0}</span>
                  </div>

                  {territory.revenue_tier_min && territory.revenue_tier_max && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue Tier:</span>
                      <span className="text-sm font-medium">
                        ${(territory.revenue_tier_min / 1000).toFixed(0)}K - ${(territory.revenue_tier_max / 1000).toFixed(0)}K
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

                {/* Fairness Index */}
                {territory.fairness_index !== null && territory.fairness_index !== undefined && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Fairness Index</span>
                      <span className={`text-sm font-semibold ${getFairnessColor(territory.fairness_index)}`}>
                        {getFairnessLabel(territory.fairness_index)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          territory.fairness_index >= 0.8 ? 'bg-green-500' :
                          territory.fairness_index >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(territory.fairness_index || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

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

                <div className="pt-4 border-t border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    territory.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {territory.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Table View
        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accounts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fairness</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {canManageTerritories && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerritories.map((territory) => (
                <tr key={territory.id} className={!territory.is_active ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{territory.name}</div>
                      <div className="text-sm text-gray-500">{territory.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{territory.region || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{territory.assigned_user?.full_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ${((territory.territory_value || 0) / 1000).toFixed(0)}K
                  </td>
                  <td className="px-4 py-3 text-sm">{territory.account_count || 0}</td>
                  <td className="px-4 py-3">
                    {territory.fairness_index !== null && (
                      <span className={`text-sm font-medium ${getFairnessColor(territory.fairness_index)}`}>
                        {(territory.fairness_index * 100).toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      territory.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {territory.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManageTerritories && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(territory)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(territory.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {filteredTerritories.length === 0 && (
        <div className="text-center py-12">
          <Map className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No territories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManageTerritories 
              ? 'Get started by creating your first territory'
              : 'Territories will appear here once they are created'
            }
          </p>
          {canManageTerritories && (
            <div className="mt-6">
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus size={18} /> Create Territory
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Territory Modal */}
      <TerritoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        territory={selectedTerritory}
        organizationId={organizationId}
        users={users}
      />
    </div>
  )
}







