'use client'

import React, { useState } from 'react'
import { IntegrationHub } from '@/components/integrations/IntegrationHub'

export default function IntegrationsPage() {
  const [organizationId] = useState('00000000-0000-0000-0000-000000000001') // Default organization ID

  const handleIntegrationConnect = (_integration: { id: string; name: string; type: string }) => {
    // Handle integration connection
  }

  const handleIntegrationDisconnect = (_integrationId: string) => {
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
