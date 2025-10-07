'use client'

import React, { useState } from 'react'
import { LearningDashboard } from '@/components/learning/LearningDashboard';

export default function LearningPage() {
  const [userId] = useState('user-123') // This would come from auth context
  const [organizationId] = useState('org-123') // This would come from auth context

  const _handleProgressUpdate = (_moduleId: string, _progress: number) => {
    // Handle progress update
  }

  const _handleModuleComplete = (_moduleId: string) => {
    // Handle module completion
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Learning Platform</h1>
              <p className="text-sm text-gray-600">Enhance your sales skills with our comprehensive learning modules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LearningDashboard
          userId={userId}
          organizationId={organizationId}
        />
      </div>
    </div>
  )
}
