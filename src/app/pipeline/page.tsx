'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PipelineConfigAPI, PipelineConfigData } from '@/lib/api/pipeline-config'
import { PipelineBuilder } from '@/components/pipeline/PipelineBuilder'
import { createClientComponentClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/config'

export default function PipelinePage() {
  return (
    <AuthWrapper>
      <PipelineContent />
    </AuthWrapper>
  )
}

function PipelineContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [configurations, setConfigurations] = useState<PipelineConfigData[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PipelineConfigData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const loadConfigurations = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const data = await PipelineConfigAPI.getConfigurations(user.organization_id || DEFAULT_ORGANIZATION_ID)
      setConfigurations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline configurations')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, user?.organization_id])

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
      } catch (error) {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [supabase, router])

  useEffect(() => {
    if (user?.id) {
      loadConfigurations()
    }
  }, [user?.id, loadConfigurations])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline data...</p>
        </div>
      </div>
    )
  }

  const handleCreateNew = () => {
    setEditingConfig(null)
    setShowBuilder(true)
  }

  const handleEdit = (config: PipelineConfigData) => {
    setEditingConfig(config)
    setShowBuilder(true)
  }

  const handleSave = (config: PipelineConfigData) => {
    setShowBuilder(false)
    setEditingConfig(null)
    loadConfigurations() // Refresh the list
  }

  const handleCancel = () => {
    setShowBuilder(false)
    setEditingConfig(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pipeline configuration?')) return

    try {
      await PipelineConfigAPI.deleteConfiguration(id)
      loadConfigurations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pipeline configuration')
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user?.id) return

    try {
      await PipelineConfigAPI.setAsDefault(id, user.organization_id || DEFAULT_ORGANIZATION_ID)
      loadConfigurations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default pipeline')
    }
  }

  if (showBuilder) {
    return (
      <PipelineBuilder
        organizationId={user?.organization_id || DEFAULT_ORGANIZATION_ID}
        userId={user?.id || ''}
        onSave={handleSave}
        onCancel={handleCancel}
        initialConfig={editingConfig || undefined}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pipeline Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage custom sales pipelines for your organization
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Pipeline Configurations</h2>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create New Pipeline
              </button>
            </div>
          </div>

          <div className="p-6">
            {configurations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pipeline configurations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first custom pipeline configuration.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Create Pipeline
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configurations.map((config) => (
                  <div
                    key={config.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{config.name}</h3>
                        {config.description && (
                          <p className="mt-1 text-sm text-gray-600">{config.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {config.isDefault && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Default
                          </span>
                        )}
                        {config.branchSpecific && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Branch
                          </span>
                        )}
                        {config.roleSpecific && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            Role
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Stages:</span>
                        <span className="font-medium">{config.stages.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium">
                          {new Date(config.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {config.branchName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Branch:</span>
                          <span className="font-medium">{config.branchName}</span>
                        </div>
                      )}
                      {config.roleName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Role:</span>
                          <span className="font-medium">{config.roleName}</span>
                        </div>
                      )}
                    </div>

                    {/* Pipeline Stages Preview */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        {config.stages.slice(0, 5).map((stage, index) => (
                          <div
                            key={stage.id}
                            className="flex items-center"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {index < config.stages.length - 1 && (
                              <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                            )}
                          </div>
                        ))}
                        {config.stages.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{config.stages.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Edit
                      </button>
                      {!config.isDefault && (
                        <button
                          onClick={() => handleSetDefault(config.id)}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
