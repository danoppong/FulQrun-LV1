'use client'

import React from 'react'
import { AILeadManagement } from '@/components/leads/AILeadManagement';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function LeadQualificationPage() {
  return (
    <AuthWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Lead Management</h1>
          <p className="mt-2 text-gray-600">Advanced AI-powered lead qualification, scoring, and conversion system</p>
        </div>
        
        <AILeadManagement />
      </div>
    </AuthWrapper>
  )
}


