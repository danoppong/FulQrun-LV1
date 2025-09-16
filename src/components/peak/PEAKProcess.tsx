'use client'

import React from 'react'

interface PEAKProcessProps {
  opportunityId: string
  opportunityName: string
  currentStage: string
  onStageChange: (stage: string) => void
  onDocumentUpload: (stage: string, document: any) => void
  onDocumentDelete: (stage: string, documentId: string) => void
  onDocumentOpen: (document: any) => void
}

export function PEAKProcess({
  opportunityId,
  opportunityName,
  currentStage,
  onStageChange,
  onDocumentUpload,
  onDocumentDelete,
  onDocumentOpen
}: PEAKProcessProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">PEAK Process: {opportunityName}</h2>
      <p className="text-gray-600">Current Stage: {currentStage}</p>
      <p className="text-sm text-gray-500 mt-2">PEAK Process component - Implementation needed</p>
    </div>
  )
}
