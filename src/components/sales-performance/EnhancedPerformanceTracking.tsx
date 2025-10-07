'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button';

interface EnhancedPerformanceTrackingProps {
  organizationId: string
  user: any
}

interface MetricTemplate {
  id: string
  name: string
  description: string
  category: string
  metric_type: string
  unit: string
  target_default: number
  is_active: boolean
  is_system: boolean
  custom_metric_fields: CustomField[]
}

interface CustomField {
  id: string
  field_name: string
  field_type: string
  field_options: Record<string, any>
  is_required: boolean
  display_order: number
}

interface EnhancedMetric {
  id: string
  metric_template_id: string
  user_id: string
  period_start: string
  period_end: string
  actual_value: number
  target_value: number
  custom_fields: Record<string, any>
  notes: string
  status: string
  metric_template: MetricTemplate
  user: {
    id: string
    full_name: string
    email: string
  }
  territory?: {
    name: string
    region: string
  }
  quota_plan?: {
    name: string
    target_revenue: number
  }
}

export function EnhancedPerformanceTracking({ organizationId, user }: EnhancedPerformanceTrackingProps) {
  const [metrics, setMetrics] = useState<EnhancedMetric[]>([])
  const [templates, setTemplates] = useState<MetricTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [organizationId, selectedPeriod, selectedCategory])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchMetrics(),
        fetchTemplates()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        ...(selectedPeriod !== 'all' && { 
          periodStart: getPeriodStart(), 
          periodEnd: getPeriodEnd() 
        })
      })

      const response = await fetch(`/api/sales-performance/enhanced-metrics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        isActive: 'true'
      })

      const response = await fetch(`/api/sales-performance/metric-templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const getPeriodStart = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return startOfMonth.toISOString().split('T')[0]
  }

  const getPeriodEnd = () => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return endOfMonth.toISOString().split('T')[0]
  }

  const calculateAttainment = (actual: number, target: number) => {
    if (target === 0) return 0
    return Math.min((actual / target) * 100, 1000) // Cap at 1000%
  }

  const getAttainmentColor = (attainment: number) => {
    if (attainment >= 100) return 'text-green-600'
    if (attainment >= 80) return 'text-yellow-600'
    if (attainment >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getAttainmentBgColor = (attainment: number) => {
    if (attainment >= 100) return 'bg-green-500'
    if (attainment >= 80) return 'bg-yellow-500'
    if (attainment >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatValue = (value: number, template: MetricTemplate) => {
    switch (template.metric_type) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'count':
        return value.toLocaleString()
      case 'score':
        return `${value.toFixed(1)}/5`
      default:
        return value.toString()
    }
  }

  const canManageMetrics = ['manager', 'admin'].includes(user?.profile?.role)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Performance Tracking</h2>
        <div className="flex space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="revenue">Revenue</option>
            <option value="deals">Deals</option>
            <option value="activities">Activities</option>
            <option value="conversion">Conversion</option>
            <option value="customer">Customer</option>
            <option value="product">Product</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
            <option value="all">All Time</option>
          </select>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Metric
          </Button>
          {canManageMetrics && (
            <Button
              onClick={() => setShowTemplateForm(true)}
              variant="outline"
            >
              Manage Templates
            </Button>
          )}
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Templates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {templates.map((template) => {
          const templateMetrics = metrics.filter(m => m.metric_template_id === template.id)
          const avgAttainment = templateMetrics.length > 0 
            ? templateMetrics.reduce((sum, m) => sum + calculateAttainment(m.actual_value, m.target_value), 0) / templateMetrics.length
            : 0

          return (
            <Card key={template.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.is_system ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {template.is_system ? 'System' : 'Custom'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Records:</span>
                  <span className="font-medium">{templateMetrics.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Attainment:</span>
                  <span className={`font-medium ${getAttainmentColor(avgAttainment)}`}>
                    {avgAttainment.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit:</span>
                  <span className="font-medium">{template.unit || 'N/A'}</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const attainment = calculateAttainment(metric.actual_value, metric.target_value)
          const template = metric.metric_template || {
            name: 'Unknown Metric',
            category: 'general',
            description: 'No template information available'
          }

          return (
            <Card key={metric.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.category === 'revenue' ? 'bg-green-100 text-green-800' :
                    template.category === 'deals' ? 'bg-blue-100 text-blue-800' :
                    template.category === 'activities' ? 'bg-yellow-100 text-yellow-800' :
                    template.category === 'conversion' ? 'bg-purple-100 text-purple-800' :
                    template.category === 'performance' ? 'bg-indigo-100 text-indigo-800' :
                    template.category === 'outcome' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User:</span>
                    <span className="text-sm font-medium">{metric.user?.full_name || 'Unknown User'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="text-sm font-medium">
                      {new Date(metric.period_start).toLocaleDateString()} - {new Date(metric.period_end).toLocaleDateString()}
                    </span>
                  </div>

                  {metric.territory && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Territory:</span>
                      <span className="text-sm font-medium">{metric.territory.name}</span>
                    </div>
                  )}
                </div>

                {/* Performance Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Performance</span>
                    <span className={`text-sm font-semibold ${getAttainmentColor(attainment)}`}>
                      {attainment.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getAttainmentBgColor(attainment)}`}
                      style={{ width: `${Math.min(attainment, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Actual: {formatValue(metric.actual_value, template)}</span>
                    <span>Target: {formatValue(metric.target_value, template)}</span>
                  </div>
                </div>

                {/* Custom Fields */}
                {metric.custom_fields && Object.keys(metric.custom_fields).length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Data</h4>
                    <div className="space-y-1">
                      {Object.entries(metric.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {metric.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                    <p className="text-sm text-gray-600">{metric.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View History
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No performance metrics found</div>
          <p className="text-gray-400 mt-2">
            {templates.length === 0 
              ? 'Create metric templates first, then add performance data'
              : 'Add your first performance metric to get started'
            }
          </p>
          {templates.length > 0 && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Add First Metric
            </Button>
          )}
        </div>
      )}

      {/* Create Metric Form Modal */}
      {showCreateForm && (
        <MetricCreationForm
          templates={templates}
          organizationId={organizationId}
          user={user}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchData()
          }}
        />
      )}

      {/* Template Management Modal */}
      {showTemplateForm && canManageMetrics && (
        <TemplateManagementForm
          templates={templates}
          organizationId={organizationId}
          user={user}
          onClose={() => setShowTemplateForm(false)}
          onSuccess={() => {
            setShowTemplateForm(false)
            fetchTemplates()
          }}
        />
      )}
    </div>
  )
}

// Metric Creation Form Component
function MetricCreationForm({ templates, organizationId, user, onClose, onSuccess }: {
  templates: MetricTemplate[]
  organizationId: string
  user: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    metric_template_id: '',
    user_id: user?.id || '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    actual_value: '',
    target_value: '',
    custom_fields: {},
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const selectedTemplate = templates.find(t => t.id === formData.metric_template_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/sales-performance/enhanced-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          actual_value: parseFloat(formData.actual_value),
          target_value: parseFloat(formData.target_value)
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating metric:', error)
      alert('Failed to create metric')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Performance Metric</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metric Template *
            </label>
            <select
              value={formData.metric_template_id}
              onChange={(e) => setFormData({ ...formData, metric_template_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a metric template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Start *
              </label>
              <input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period End *
              </label>
              <input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_value}
                onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={selectedTemplate?.unit || 'Value'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={selectedTemplate?.unit || 'Value'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? 'Creating...' : 'Create Metric'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Template Management Form Component
function TemplateManagementForm({ templates, organizationId, user, onClose, onSuccess }: {
  templates: MetricTemplate[]
  organizationId: string
  user: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Manage Metric Templates</h3>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowCreateTemplate(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Template
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{template.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.is_system ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {template.is_system ? 'System' : 'Custom'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="text-sm text-gray-500">
                  <div>Category: {template.category}</div>
                  <div>Type: {template.metric_type}</div>
                  <div>Unit: {template.unit || 'N/A'}</div>
                  <div>Default Target: {template.target_default}</div>
                </div>
                {template.custom_metric_fields && template.custom_metric_fields.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Custom Fields: {template.custom_metric_fields.length}
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  {!template.is_system && (
                    <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {showCreateTemplate && (
          <CreateTemplateForm
            organizationId={organizationId}
            user={user}
            onClose={() => setShowCreateTemplate(false)}
            onSuccess={() => {
              setShowCreateTemplate(false)
              onSuccess()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Template Form Component
function CreateTemplateForm({ organizationId, user, onClose, onSuccess }: {
  organizationId: string
  user: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    metric_type: 'count',
    unit: '',
    target_default: 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/sales-performance/metric-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Create Metric Template</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
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
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="revenue">Revenue</option>
                <option value="deals">Deals</option>
                <option value="activities">Activities</option>
                <option value="conversion">Conversion</option>
                <option value="customer">Customer</option>
                <option value="product">Product</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metric Type *
              </label>
              <select
                value={formData.metric_type}
                onChange={(e) => setFormData({ ...formData, metric_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="count">Count</option>
                <option value="percentage">Percentage</option>
                <option value="currency">Currency</option>
                <option value="duration">Duration</option>
                <option value="score">Score</option>
                <option value="ratio">Ratio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., USD, calls, hours"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Target
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.target_default}
                onChange={(e) => setFormData({ ...formData, target_default: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
