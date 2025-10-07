'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SlackIntegration as _SlackIntegration } from '@/lib/integrations/slack';
import { DocuSignIntegration as _DocuSignIntegration } from '@/lib/integrations/docusign'
import { StripeIntegration as _StripeIntegration } from '@/lib/integrations/stripe';
import { GongIntegration as _GongIntegration } from '@/lib/integrations/gong';

interface Integration {
  id: string
  name: string
  type: 'slack' | 'docusign' | 'stripe' | 'gong'
  status: 'connected' | 'disconnected' | 'error'
  description: string
  icon: string
  color: string
}

interface IntegrationHubProps {
  organizationId: string
  onIntegrationConnect: (integration: Integration) => void
  onIntegrationDisconnect: (integrationId: string) => void
}

export function IntegrationHub({
  organizationId,
  onIntegrationConnect,
  onIntegrationDisconnect
}: IntegrationHubProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const availableIntegrations: Integration[] = useMemo(() => [
    {
      id: 'slack',
      name: 'Slack',
      type: 'slack',
      status: 'disconnected',
      description: 'Send notifications and updates to Slack channels',
      icon: '💬',
      color: 'bg-purple-500'
    },
    {
      id: 'docusign',
      name: 'DocuSign',
      type: 'docusign',
      status: 'disconnected',
      description: 'Send and track contracts and agreements',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'stripe',
      status: 'disconnected',
      description: 'Process payments and manage billing',
      icon: '💳',
      color: 'bg-green-500'
    },
    {
      id: 'gong',
      name: 'Gong',
      type: 'gong',
      status: 'disconnected',
      description: 'Analyze sales calls and conversations',
      icon: '🎯',
      color: 'bg-orange-500'
    }
  ], [])

  const loadIntegrations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load integration statuses
      const response = await fetch(`/api/integrations?organizationId=${organizationId}`)
      if (response.ok) {
        const connectedIntegrations = await response.json()
        const updatedIntegrations = availableIntegrations.map(integration => {
          const connected = connectedIntegrations.find((ci: { integration_type: string }) => ci.integration_type === integration.type)
          return {
            ...integration,
            status: (connected ? 'connected' : 'disconnected') as 'connected' | 'disconnected'
          }
        })
        setIntegrations(updatedIntegrations)
      } else {
        setIntegrations(availableIntegrations)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
      setIntegrations(availableIntegrations)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, availableIntegrations])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  const handleConnect = async (integration: Integration) => {
    try {
      // In a real implementation, this would redirect to OAuth flow
      const response = await fetch(`/api/integrations/${integration.type}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId })
      })

      if (response.ok) {
        const updatedIntegration = { ...integration, status: 'connected' as const }
        setIntegrations(prev => prev.map(i => i.id === integration.id ? updatedIntegration : i))
        onIntegrationConnect(updatedIntegration)
      } else {
        throw new Error('Failed to connect integration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration')
    }
  }

  const handleDisconnect = async (integration: Integration) => {
    try {
      const response = await fetch(`/api/integrations/${integration.type}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId })
      })

      if (response.ok) {
        const updatedIntegration = { ...integration, status: 'disconnected' as const }
        setIntegrations(prev => prev.map(i => i.id === integration.id ? updatedIntegration : i))
        onIntegrationDisconnect(integration.id)
      } else {
        throw new Error('Failed to disconnect integration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      default:
        return 'Not Connected'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Integration Hub</h2>
        <p className="text-sm text-gray-600 mt-1">
          Connect your favorite tools to streamline your sales process
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(integration => (
            <div
              key={integration.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center text-2xl mr-4`}>
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {getStatusText(integration.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {integration.status === 'connected' ? (
                  <button
                    onClick={() => handleDisconnect(integration)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(integration)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
