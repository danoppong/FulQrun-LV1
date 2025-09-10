'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { LearningModuleViewer } from '@/components/learning/LearningModuleViewer'

export default function LearningModulePage() {
  const params = useParams()
  const moduleId = params.id as string
  const [userId] = useState('user-123') // This would come from auth context

  const handleProgressUpdate = (moduleId: string, progress: number) => {
    console.log('Progress updated:', moduleId, progress)
    // Handle progress update
  }

  const handleModuleComplete = (moduleId: string) => {
    console.log('Module completed:', moduleId)
    // Handle module completion
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a
                href="/learning"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Learning
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LearningModuleViewer
          moduleId={moduleId}
          userId={userId}
          onProgressUpdate={handleProgressUpdate}
          onModuleComplete={handleModuleComplete}
        />
      </div>
    </div>
  )
}
