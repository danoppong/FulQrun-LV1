'use client'

import React, { useState, useEffect } from 'react';
import { ;
  MEDDPICC_CONFIG, 
  MEDDPICCResponse as _MEDDPICCResponse, 
  MEDDPICCAssessment,
  calculateMEDDPICCScore as _calculateMEDDPICCScore,
  getMEDDPICCLevel
} from '@/lib/meddpicc'
import { ;
  ChartBarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface MEDDPICCDashboardProps {
  opportunityId: string
  assessment?: MEDDPICCAssessment
  className?: string
}

export default function MEDDPICCDashboard({
  opportunityId: _opportunityId,
  assessment,
  className = ''
}: MEDDPICCDashboardProps) {
  const [currentAssessment, setCurrentAssessment] = useState<MEDDPICCAssessment | null>(assessment || null)

  useEffect(() => {
    if (assessment) {
      setCurrentAssessment(assessment)
    }
  }, [assessment])

  if (!currentAssessment) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No MEDDPICC assessment available</p>
        </div>
      </div>
    )
  }

  const { overallScore, qualificationLevel, litmusTestScore, pillarScores, nextActions, stageGateReadiness } = currentAssessment
  const levelInfo = getMEDDPICCLevel(overallScore)

  const getPillarStatus = (pillarId: string) => {
    const score = pillarScores[pillarId] || 0
    if (score >= 80) return { icon: CheckCircleIcon, color: 'text-green-500', status: 'Complete' }
    if (score >= 60) return { icon: ClockIcon, color: 'text-yellow-500', status: 'In Progress' }
    if (score >= 40) return { icon: ExclamationTriangleIcon, color: 'text-orange-500', status: 'Needs Work' }
    return { icon: XCircleIcon, color: 'text-red-500', status: 'Critical' }
  }

  const getStageGateStatus = (isReady: boolean) => {
    return isReady 
      ? { icon: CheckCircleIcon, color: 'text-green-500', text: 'Ready' }
      : { icon: XCircleIcon, color: 'text-red-500', text: 'Not Ready' }
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">MEDDPICC Qualification Status</h3>
            <p className="text-sm text-gray-500">Sales qualification assessment overview</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${levelInfo.color} text-white`}>
              {overallScore}% - {qualificationLevel}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Litmus Test: {litmusTestScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Qualification</span>
            <span className="text-sm text-gray-500">{overallScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${levelInfo.color}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{levelInfo.description}</p>
        </div>

        {/* Pillar Status Grid */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pillar Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars ? MEDDPICC_CONFIG.pillars.map((pillar) => {
              const score = pillarScores[pillar.id] || 0
              const status = getPillarStatus(pillar.id)
              const StatusIcon = status.icon
              
              return (
                <div key={pillar.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">{pillar.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{pillar.displayName}</p>
                    <p className="text-xs text-gray-500">{score}%</p>
                  </div>
                  <StatusIcon className={`h-4 w-4 ${status.color}`} />
                </div>
              )
            }) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">Loading MEDDPICC configuration...</p>
              </div>
            )}
          </div>
        </div>

        {/* Stage Gate Readiness */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">PEAK Stage Gate Readiness</h4>
          <div className="space-y-2">
            {Object.entries(stageGateReadiness).map(([gate, isReady]) => {
              const status = getStageGateStatus(isReady)
              const StatusIcon = status.icon
              const gateName = gate.replace('_to_', ' → ')
              
              return (
                <div key={gate} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{gateName}</span>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next Actions */}
        {nextActions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recommended Actions</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <ul className="text-sm text-blue-800 space-y-1">
                {nextActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-0.5">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Qualification Insights */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Qualification Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {overallScore >= 80 && (
              <p className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                This opportunity is well-qualified and ready for closing
              </p>
            )}
            {overallScore >= 60 && overallScore < 80 && (
              <p className="flex items-center">
                <ClockIcon className="h-4 w-4 text-yellow-500 mr-2" />
                Good qualification level, focus on completing remaining pillars
              </p>
            )}
            {overallScore >= 40 && overallScore < 60 && (
              <p className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-2" />
                Moderate qualification, significant work needed on key areas
              </p>
            )}
            {overallScore < 40 && (
              <p className="flex items-center">
                <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                Low qualification, consider focusing on other opportunities
              </p>
            )}
            
            {litmusTestScore < 70 && (
              <p className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-2" />
                Litmus test indicates gaps in critical qualification areas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
