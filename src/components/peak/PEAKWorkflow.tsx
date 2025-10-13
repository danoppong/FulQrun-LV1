'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StageDocuments } from './StageDocuments'
import { SharePointDocument } from '@/lib/integrations/sharepoint';
import { PEAK_STAGE_ORDER, getStageInfo, type PEAKStageId } from '@/lib/peak'

interface PEAKWorkflowProps {
  opportunityId: string
  opportunityName: string
  currentStage: string
  onStageChange: (stage: string) => void
  onDocumentUpload: (stage: string, document: SharePointDocument) => void
  onDocumentDelete: (documentId: string) => void
  onDocumentOpen: (document: SharePointDocument) => void
}

interface StageProgress {
  stage: string
  completed: boolean
  progress: number
  requiredDocuments: number
  completedDocuments: number
  canAdvance: boolean
}

export function PEAKWorkflow({
  opportunityId,
  opportunityName: _opportunityName,
  currentStage,
  onStageChange,
  onDocumentUpload,
  onDocumentDelete,
  onDocumentOpen
}: PEAKWorkflowProps) {
  const [stages, setStages] = useState<StageProgress[]>([])
  const [documents, setDocuments] = useState<Record<string, SharePointDocument[]>>({})
  const [selectedStage, setSelectedStage] = useState<string>(currentStage)
  const [advancing, setAdvancing] = useState<boolean>(false)
  const [advanceError, setAdvanceError] = useState<string | null>(null)

  const peakStages = useMemo(() => PEAK_STAGE_ORDER.map(s => ({ id: s.id, name: s.name, description: s.description })), [])

  const loadStageProgress = useCallback(async () => {
    try {
      // Simulate loading stage progress from API
      const mockProgress: StageProgress[] = peakStages.map((stage, index) => ({
        stage: stage.id,
        completed: index < peakStages.findIndex(s => s.id === currentStage),
        progress: index < peakStages.findIndex(s => s.id === currentStage) ? 100 : 
                 index === peakStages.findIndex(s => s.id === currentStage) ? 45 : 0,
        requiredDocuments: getRequiredDocumentCount(stage.id),
        completedDocuments: 0, // This would be loaded from API
        canAdvance: index <= peakStages.findIndex(s => s.id === currentStage)
      }))

      setStages(mockProgress)
    } catch (_error) {
      // Handle error silently for now
    }
  }, [currentStage, peakStages])

  useEffect(() => {
    void loadStageProgress()
  }, [loadStageProgress])

  const getRequiredDocumentCount = (stage: string): number => {
    const requirements: Record<string, number> = {
      'prospecting': 2,
      'engaging': 3,
      'advancing': 2,
      'key_decision': 3
    }
    return requirements[stage] || 0
  }

  const handleStageClick = (stage: string) => {
    const stageIndex = peakStages.findIndex(s => s.id === stage)
    const currentIndex = peakStages.findIndex(s => s.id === currentStage)
    
    // Only allow navigation to current stage or previous stages
    if (stageIndex <= currentIndex) {
      setSelectedStage(stage)
    }
  }

  const handleAdvanceStage = async (fromStage: string, toStage: string) => {
    try {
      // Check if current stage requirements are met
      const currentStageData = stages.find(s => s.stage === fromStage)
      if (!currentStageData || !currentStageData.completed) {
        alert('Please complete all required documents before advancing to the next stage.')
        return
      }

      setAdvancing(true)
      setAdvanceError(null)
      const res = await fetch('/api/peak/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, from: fromStage, to: toStage })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setAdvanceError(j.error || 'Failed to advance stage')
        setAdvancing(false)
        return
      }
      
      onStageChange(toStage)
      setSelectedStage(toStage)
      
      // Update local state
      setStages(prev => prev.map(stage => ({
        ...stage,
        completed: peakStages.findIndex(s => s.id === stage.stage) < peakStages.findIndex(s => s.id === toStage),
        progress: peakStages.findIndex(s => s.id === stage.stage) < peakStages.findIndex(s => s.id === toStage) ? 100 : 
                 peakStages.findIndex(s => s.id === stage.stage) === peakStages.findIndex(s => s.id === toStage) ? 0 : stage.progress
      })))
      setAdvancing(false)
    } catch (_error) {
      setAdvanceError('Failed to advance stage')
      setAdvancing(false)
    }
  }

  const handleDocumentUpload = (stage: string, document: SharePointDocument) => {
    onDocumentUpload(stage, document)
    
    // Update local documents state
    setDocuments(prev => ({
      ...prev,
      [stage]: [...(prev[stage] || []), document]
    }))

    // Update stage progress
    setStages(prev => prev.map(s => {
      if (s.stage === stage) {
        const newCompletedDocuments = s.completedDocuments + 1
        const progress = Math.min((newCompletedDocuments / s.requiredDocuments) * 100, 100)
        return {
          ...s,
          completedDocuments: newCompletedDocuments,
          progress,
          completed: progress === 100
        }
      }
      return s
    }))
  }

  const handleDocumentDelete = (documentId: string) => {
    onDocumentDelete(documentId)
    
    // Update stage progress
    setStages(prev => prev.map(s => {
      const newCompletedDocuments = Math.max(s.completedDocuments - 1, 0)
      const progress = Math.min((newCompletedDocuments / s.requiredDocuments) * 100, 100)
      return {
        ...s,
        completedDocuments: newCompletedDocuments,
        progress,
        completed: progress === 100
      }
    }))
  }

  const getStageColor = (stage: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500'
    if (isActive) return 'bg-blue-500'
    return 'bg-gray-300'
  }

  const getStageTextColor = (stage: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'text-green-700'
    if (isActive) return 'text-blue-700'
    return 'text-gray-500'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">PEAK Process Workflow</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your sales process through the PEAK methodology
        </p>
      </div>

      {/* Stage Navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {peakStages.map((stage, index) => {
            const stageData = stages.find(s => s.stage === stage.id)
            const isActive = stage.id === selectedStage
            const isCompleted = stageData?.completed || false
            const canClick = index <= peakStages.findIndex(s => s.id === currentStage)
            
            return (
              <div key={stage.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => canClick && handleStageClick(stage.id)}
                    disabled={!canClick}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      canClick ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                    } ${getStageColor(stage.id, isActive, isCompleted)} ${getStageTextColor(stage.id, isActive, isCompleted)}`}
                  >
                    {isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                      {stage.name}
                    </p>
                    {stageData && (
                      <p className="text-xs text-gray-500">
                        {stageData.completedDocuments}/{stageData.requiredDocuments} docs
                      </p>
                    )}
                  </div>
                </div>
                {index < peakStages.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage Content */}
      <div className="p-6">
        {selectedStage && (
          <div className="space-y-6">
            {/* Stage Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {getStageInfo(selectedStage as PEAKStageId).name} Stage
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getStageInfo(selectedStage as PEAKStageId).description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stages.find(s => s.stage === selectedStage)?.progress || 0}%
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stages.find(s => s.stage === selectedStage)?.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stage Documents */}
            <StageDocuments
              opportunityId={opportunityId}
              stage={selectedStage}
              documents={documents[selectedStage] || []}
              onDocumentUpload={handleDocumentUpload}
              onDocumentDelete={handleDocumentDelete}
              onDocumentOpen={onDocumentOpen}
            />

            {/* Stage Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {stages.find(s => s.stage === selectedStage)?.completed ? (
                  <span className="text-green-600">✓ Stage completed</span>
                ) : (
                  <span>
                    {stages.find(s => s.stage === selectedStage)?.completedDocuments || 0} of{' '}
                    {stages.find(s => s.stage === selectedStage)?.requiredDocuments || 0} required documents completed
                  </span>
                )}
              </div>
              
              {selectedStage !== currentStage && (
                <button
                  onClick={() => {
                    const currentIndex = peakStages.findIndex(s => s.id === currentStage)
                    const selectedIndex = peakStages.findIndex(s => s.id === selectedStage)
                    if (selectedIndex < currentIndex) {
                      onStageChange(selectedStage)
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Return to Stage
                </button>
              )}
              
              {selectedStage === currentStage && peakStages.findIndex(s => s.id === selectedStage) < peakStages.length - 1 && (
                <button
                  onClick={() => {
                    const currentIndex = peakStages.findIndex(s => s.id === currentStage)
                    const nextStage = peakStages[currentIndex + 1]
                    handleAdvanceStage(currentStage, nextStage.id)
                  }}
                  disabled={advancing || !stages.find(s => s.stage === selectedStage)?.completed}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {advancing ? 'Advancing…' : 'Advance to Next Stage'}
                </button>
              )}
            </div>
            {advanceError && (
              <p className="mt-2 text-sm text-red-600" role="alert">{advanceError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
