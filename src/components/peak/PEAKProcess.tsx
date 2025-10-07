'use client'

import React from 'react';

interface PEAKProcessProps {
  opportunityId: string
  opportunityName: string
  currentStage: string
  onStageChange: (stage: string) => void
  onDocumentUpload: (stage: string, document: File) => void
  onDocumentDelete: (stage: string, documentId: string) => void
  onDocumentOpen: (document: { id: string; name: string; url: string }) => void
}

export function PEAKProcess({
  opportunityId: _opportunityId,
  opportunityName,
  currentStage,
  onStageChange: _onStageChange,
  onDocumentUpload: _onDocumentUpload,
  onDocumentDelete: _onDocumentDelete,
  onDocumentOpen: _onDocumentOpen
}: PEAKProcessProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">PEAK Process: {opportunityName}</h2>
      <p className="text-gray-600">Current Stage: {currentStage}</p>
      <p className="text-sm text-gray-500 mt-2">PEAK Process component - Implementation needed</p>
    </div>
  )
}
