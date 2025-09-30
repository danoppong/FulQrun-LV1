'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ScenarioPlanningProps {
  organizationId: string
  user: any
}

interface ScenarioPlan {
  id: string
  name: string
  description: string
  scenario_type: string
  base_scenario_id: string
  assumptions: Record<string, any>
  quota_changes: Record<string, any>
  territory_changes: Record<string, any>
  compensation_changes: Record<string, any>
  impact_analysis: Record<string, any>
  budget_variance: number
  fairness_score: number
  is_active: boolean
  created_by_user: {
    id: string
    full_name: string
    email: string
  }
}

export function ScenarioPlanning({ organizationId, user }: ScenarioPlanningProps) {
  const [scenarios, setScenarios] = useState<ScenarioPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchScenarios()
  }, [organizationId, selectedType])

  const fetchScenarios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        ...(selectedType !== 'all' && { scenarioType: selectedType })
      })

      const response = await fetch(`/api/sales-performance/scenarios?${params}`)
      if (response.ok) {
        const data = await response.json()
        setScenarios(data)
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageScenarios = ['manager', 'admin'].includes(user?.profile?.role)

  const getScenarioTypeColor = (scenarioType: string) => {
    switch (scenarioType) {
      case 'quota_adjustment': return 'bg-blue-100 text-blue-800'
      case 'territory_redesign': return 'bg-green-100 text-green-800'
      case 'compensation_change': return 'bg-purple-100 text-purple-800'
      case 'what_if': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBudgetVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getFairnessScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
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
        <h2 className="text-2xl font-bold text-gray-900">Scenario Planning</h2>
        <div className="flex space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Scenarios</option>
            <option value="quota_adjustment">Quota Adjustments</option>
            <option value="territory_redesign">Territory Redesign</option>
            <option value="compensation_change">Compensation Changes</option>
            <option value="what_if">What-If Analysis</option>
          </select>
          {canManageScenarios && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Scenario
            </Button>
          )}
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScenarioTypeColor(scenario.scenario_type)}`}>
                    {scenario.scenario_type.replace('_', ' ')}
                  </span>
                  {scenario.is_active && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created By:</span>
                  <span className="text-sm font-medium">
                    {scenario.created_by_user.full_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Budget Variance:</span>
                  <span className={`text-sm font-medium ${getBudgetVarianceColor(scenario.budget_variance)}`}>
                    ${scenario.budget_variance.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fairness Score:</span>
                  <span className={`text-sm font-medium ${getFairnessScoreColor(scenario.fairness_score)}`}>
                    {(scenario.fairness_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Assumptions */}
              {scenario.assumptions && Object.keys(scenario.assumptions).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Assumptions</h4>
                  <div className="space-y-1">
                    {Object.entries(scenario.assumptions).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                    {Object.keys(scenario.assumptions).length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{Object.keys(scenario.assumptions).length - 3} more assumptions
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Impact Analysis */}
              {scenario.impact_analysis && Object.keys(scenario.impact_analysis).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Impact Summary</h4>
                  <div className="space-y-1">
                    {Object.entries(scenario.impact_analysis).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Compare
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No scenarios found</div>
          <p className="text-gray-400 mt-2">
            {canManageScenarios 
              ? 'Create your first scenario to get started with planning'
              : 'Scenarios will appear here once they are created'
            }
          </p>
        </div>
      )}
    </div>
  )
}
