'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { WorkflowAutomationAPI, WorkflowAutomationData, WorkflowAction } from '@/lib/api/workflow-automation'
import { PipelineStage } from '@/lib/api/pipeline-config';

interface WorkflowEditorProps {
  organizationId: string
  userId: string
  stages: PipelineStage[]
}

export function WorkflowEditor({ organizationId, userId, stages }: WorkflowEditorProps) {
  const [workflows, setWorkflows] = useState<WorkflowAutomationData[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowAutomationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await WorkflowAutomationAPI.getActiveAutomations(organizationId)
      setWorkflows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const handleCreateWorkflow = async (workflow: Omit<WorkflowAutomationData, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await WorkflowAutomationAPI.createAutomation(workflow)
      setWorkflows(prev => [created, ...prev])
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    }
  }

  const handleUpdateWorkflow = async (id: string, updates: Partial<WorkflowAutomationData>) => {
    try {
      const updated = await WorkflowAutomationAPI.updateAutomation(id, updates)
      setWorkflows(prev => prev.map(w => w.id === id ? updated : w))
      setEditingWorkflow(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow')
    }
  }

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await WorkflowAutomationAPI.deleteAutomation(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow')
    }
  }

  const handleToggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      await WorkflowAutomationAPI.updateAutomation(id, { isActive })
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive } : w))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle workflow')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading workflows...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Workflow Automation</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Workflow
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Add Workflow Form */}
      {showAddForm && (
        <WorkflowForm
          organizationId={organizationId}
          userId={userId}
          stages={stages}
          onSubmit={handleCreateWorkflow}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Workflow Form */}
      {editingWorkflow && (
        <WorkflowForm
          organizationId={organizationId}
          userId={userId}
          stages={stages}
          workflow={editingWorkflow}
          onSubmit={(updates) => handleUpdateWorkflow(editingWorkflow.id, updates)}
          onCancel={() => setEditingWorkflow(null)}
        />
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No workflows configured yet. Add your first workflow to automate your sales process.</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`p-4 border rounded-lg ${
                workflow.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-md font-medium text-gray-900">{workflow.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workflow.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workflow.triggerType === 'stage_change' ? 'bg-blue-100 text-blue-800' :
                      workflow.triggerType === 'field_update' ? 'bg-purple-100 text-purple-800' :
                      workflow.triggerType === 'time_based' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.triggerType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="mt-1 text-sm text-gray-600">{workflow.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''} configured
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingWorkflow(workflow)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit workflow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleWorkflow(workflow.id, !workflow.isActive)}
                    className={`p-1 ${workflow.isActive ? 'text-green-400 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    title={workflow.isActive ? 'Deactivate workflow' : 'Activate workflow'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete workflow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface WorkflowFormProps {
  organizationId: string
  userId: string
  stages: PipelineStage[]
  workflow?: WorkflowAutomationData
  onSubmit: (workflow: Omit<WorkflowAutomationData, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

function WorkflowForm({ organizationId, userId, stages, workflow, onSubmit, onCancel }: WorkflowFormProps) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    triggerType: workflow?.triggerType || 'stage_change' as const,
    triggerConditions: workflow?.triggerConditions || {},
    actions: workflow?.actions || [],
    isActive: workflow?.isActive ?? true,
    branchSpecific: workflow?.branchSpecific ?? false,
    roleSpecific: workflow?.roleSpecific ?? false,
    branchName: workflow?.branchName || '',
    roleName: workflow?.roleName || '',
  })

  const [newAction, setNewAction] = useState<WorkflowAction>({
    type: 'send_email',
    config: {},
    delay: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return

    onSubmit({
      name: formData.name,
      description: formData.description || null,
      triggerType: formData.triggerType,
      triggerConditions: formData.triggerConditions,
      actions: formData.actions,
      isActive: formData.isActive,
      branchSpecific: formData.branchSpecific,
      roleSpecific: formData.roleSpecific,
      branchName: formData.branchSpecific ? formData.branchName : null,
      roleName: formData.roleSpecific ? formData.roleName : null,
      organizationId,
      createdBy: userId,
    })
  }

  const handleAddAction = () => {
    if (newAction.type && Object.keys(newAction.config).length > 0) {
      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, { ...newAction }]
      }))
      setNewAction({
        type: 'send_email',
        config: {},
        delay: 0
      })
    }
  }

  const handleRemoveAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }))
  }

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'update_field', label: 'Update Field' },
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'create_activity', label: 'Create Activity' },
    { value: 'assign_user', label: 'Assign User' },
    { value: 'webhook', label: 'Webhook' }
  ]

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-md font-medium text-gray-900 mb-4">
        {workflow ? 'Edit Workflow' : 'Add New Workflow'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workflow name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger Type
            </label>
            <select
              value={formData.triggerType}
              onChange={(e) => setFormData(prev => ({ ...prev, triggerType: e.target.value as 'stage_change' | 'field_update' | 'time_based' | 'manual' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="stage_change">Stage Change</option>
              <option value="field_update">Field Update</option>
              <option value="time_based">Time Based</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter workflow description"
          />
        </div>

        {/* Trigger Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Conditions
          </label>
          <div className="space-y-2">
            {formData.triggerType === 'stage_change' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">When stage changes to:</label>
                <select
                  value={formData.triggerConditions.stage || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    triggerConditions: { ...prev.triggerConditions, stage: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stage</option>
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.triggerType === 'field_update' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Field</label>
                  <select
                    value={formData.triggerConditions.field || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      triggerConditions: { ...prev.triggerConditions, field: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select field</option>
                    <option value="deal_value">Deal Value</option>
                    <option value="meddpicc_score">MEDDPICC Score</option>
                    <option value="probability">Probability</option>
                    <option value="close_date">Close Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Operator</label>
                  <select
                    value={formData.triggerConditions.operator || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      triggerConditions: { ...prev.triggerConditions, operator: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select operator</option>
                    <option value="equals">Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Value</label>
                  <input
                    type="text"
                    value={formData.triggerConditions.value || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      triggerConditions: { ...prev.triggerConditions, value: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Actions
          </label>
          <div className="space-y-2">
            {formData.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                <span className="text-sm font-medium">{action.type.replace('_', ' ').toUpperCase()}</span>
                <span className="text-sm text-gray-500">
                  {action.delay ? `(Delay: ${action.delay}min)` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAction(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <select
                value={newAction.type}
                onChange={(e) => setNewAction(prev => ({ ...prev, type: e.target.value as 'email' | 'notification' | 'task' | 'approval' | 'integration' }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={newAction.delay}
                onChange={(e) => setNewAction(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Delay (min)"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Add Action
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active Workflow
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="branchSpecific"
              checked={formData.branchSpecific}
              onChange={(e) => setFormData(prev => ({ ...prev, branchSpecific: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="branchSpecific" className="ml-2 text-sm text-gray-700">
              Branch Specific
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {workflow ? 'Update Workflow' : 'Create Workflow'}
          </button>
        </div>
      </form>
    </div>
  )
}
