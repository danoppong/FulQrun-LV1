'use client'

import React, { useState, useEffect } from 'react'
import { PipelineConfigAPI, PipelineConfigData, PipelineStage } from '@/lib/api/pipeline-config'
import { StageEditor } from './StageEditor'
import { WorkflowEditor } from './WorkflowEditor'
import { PipelinePreview } from './PipelinePreview';

interface PipelineBuilderProps {
  organizationId: string
  userId: string
  onSave?: (config: PipelineConfigData) => void
  onCancel?: () => void
  initialConfig?: PipelineConfigData
}

export function PipelineBuilder({ 
  organizationId, 
  userId, 
  onSave, 
  onCancel,
  initialConfig 
}: PipelineBuilderProps) {
  const [config, setConfig] = useState<PipelineConfigData>({
    id: '',
    name: '',
    description: '',
    stages: [],
    branchSpecific: false,
    roleSpecific: false,
    branchName: null,
    roleName: null,
    isDefault: false,
    organizationId,
    createdBy: userId,
    createdAt: '',
    updatedAt: ''
  })

  const [activeTab, setActiveTab] = useState<'stages' | 'workflow' | 'preview'>('stages')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
    }
  }, [initialConfig])

  const handleStageAdd = (stage: PipelineStage) => {
    setConfig(prev => ({
      ...prev,
      stages: [...prev.stages, { ...stage, order: prev.stages.length + 1 }]
    }))
  }

  const handleStageUpdate = (index: number, updatedStage: PipelineStage) => {
    setConfig(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => i === index ? updatedStage : stage)
    }))
  }

  const handleStageDelete = (index: number) => {
    setConfig(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index).map((stage, i) => ({
        ...stage,
        order: i + 1
      }))
    }))
  }

  const handleStageReorder = (fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const newStages = [...prev.stages]
      const [movedStage] = newStages.splice(fromIndex, 1)
      newStages.splice(toIndex, 0, movedStage)
      
      return {
        ...prev,
        stages: newStages.map((stage, index) => ({
          ...stage,
          order: index + 1
        }))
      }
    })
  }

  const handleSave = async () => {
    if (!config.name.trim()) {
      setError('Pipeline name is required')
      return
    }

    if (config.stages.length === 0) {
      setError('At least one stage is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let savedConfig: PipelineConfigData

      if (config.id) {
        savedConfig = await PipelineConfigAPI.updateConfiguration(config.id, config)
      } else {
        savedConfig = await PipelineConfigAPI.createConfiguration(config)
      }

      onSave?.(savedConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pipeline configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadTemplate = async (templateType: 'peak' | 'custom') => {
    try {
      if (templateType === 'peak') {
        const peakConfig = await PipelineConfigAPI.createDefaultPEAKPipeline(organizationId, userId)
        setConfig(peakConfig)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {config.id ? 'Edit Pipeline' : 'Create Pipeline'}
        </h1>
        <p className="text-gray-600">
          Build custom sales pipelines with drag-and-drop stages and automated workflows
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pipeline Configuration Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pipeline Name *
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pipeline name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={config.description || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pipeline description"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="branchSpecific"
              checked={config.branchSpecific}
              onChange={(e) => setConfig(prev => ({ ...prev, branchSpecific: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="branchSpecific" className="ml-2 text-sm text-gray-700">
              Branch Specific
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="roleSpecific"
              checked={config.roleSpecific}
              onChange={(e) => setConfig(prev => ({ ...prev, roleSpecific: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="roleSpecific" className="ml-2 text-sm text-gray-700">
              Role Specific
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={config.isDefault}
              onChange={(e) => setConfig(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as Default
            </label>
          </div>
        </div>

        {config.branchSpecific && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name
            </label>
            <input
              type="text"
              value={config.branchName || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, branchName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter branch name"
            />
          </div>
        )}

        {config.roleSpecific && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name
            </label>
            <input
              type="text"
              value={config.roleName || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, roleName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter role name"
            />
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Start Templates</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleLoadTemplate('peak')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Load PEAK Template
          </button>
          <button
            onClick={() => handleLoadTemplate('custom')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Start from Scratch
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'stages', label: 'Pipeline Stages', count: config.stages.length },
            { id: 'workflow', label: 'Workflow Rules', count: 0 },
            { id: 'preview', label: 'Preview', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'stages' | 'workflow' | 'preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'stages' && (
          <StageEditor
            stages={config.stages}
            onStageAdd={handleStageAdd}
            onStageUpdate={handleStageUpdate}
            onStageDelete={handleStageDelete}
            onStageReorder={handleStageReorder}
          />
        )}
        
        {activeTab === 'workflow' && (
          <WorkflowEditor
            organizationId={organizationId}
            userId={userId}
            stages={config.stages}
          />
        )}
        
        {activeTab === 'preview' && (
          <PipelinePreview
            config={config}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || !config.name.trim() || config.stages.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Pipeline'}
        </button>
      </div>
    </div>
  )
}
