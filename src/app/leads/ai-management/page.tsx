'use client'

import React from 'react'
import { AILeadManagement } from '@/components/leads/AILeadManagement';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function AILeadManagementPage() {
  return (
    <AuthWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Lead Management</h1>
          <p className="mt-2 text-gray-600">Complete AI-powered lead generation, qualification, and conversion system</p>
        </div>
        
        <AILeadManagement />
      </div>
    </AuthWrapper>
  )
}
