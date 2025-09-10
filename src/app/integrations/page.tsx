'use client'

import React, { useState } from 'react'
import { IntegrationHub } from '@/components/integrations/IntegrationHub'

export default function IntegrationsPage() {
  const [organizationId] = useState('org-123') // This would come from auth context

  const handleIntegrationConnect = (integration: any) => {
    console.log('Integration connected:', integration)
    // Handle integration connection
  }

  const handleIntegrationDisconnect = (integrationId: string) => {
    console.log('Integration disconnected:', integrationId)
    // Handle integration disconnection
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
              <p className="text-sm text-gray-600">Manage your third-party integrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntegrationHub
          organizationId={organizationId}
          onIntegrationConnect={handleIntegrationConnect}
          onIntegrationDisconnect={handleIntegrationDisconnect}
        />
      </div>
    </div>
  )
}
