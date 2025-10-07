'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth'
import EnterpriseIntegrationsDashboard from '@/components/integrations/EnterpriseIntegrationsDashboard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EnterpriseIntegrationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access Enterprise Integrations.</p>
        </div>
      </div>
    );
  }

  return (
    <EnterpriseIntegrationsDashboard 
      organizationId={user.profile?.organization_id || ''} 
      userId={user.id} 
    />
  );
}
