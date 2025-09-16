'use client'

import React, { useState, useEffect } from 'react'
import { 
  MEDDPICC_CONFIG, 
  MEDDPICCResponse, 
  MEDDPICCAssessment,
  calculateMEDDPICCScore
} from '@/lib/meddpicc'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface MEDDPICCPEAKIntegrationProps {
  opportunityId: string
  currentPEAKStage: string
  assessment?: MEDDPICCAssessment
  onStageAdvance?: (fromStage: string, toStage: string) => void
  className?: string
}

export default function MEDDPICCPEAKIntegration({
  opportunityId,
  currentPEAKStage,
  assessment,
  onStageAdvance,
  className = ''
}: MEDDPICCPEAKIntegrationProps) {
  const [currentAssessment, setCurrentAssessment] = useState<MEDDPICCAssessment | null>(assessment || null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  useEffect(() => {
    if (assessment) {
      setCurrentAssessment(assessment)
    }
  }, [assessment])

  const getStageGateInfo = (fromStage: string, toStage: string) => {
    return MEDDPICC_CONFIG.integrations.peakPipeline.stageGates.find(
      gate => gate.from === fromStage && gate.to === toStage
    )
  }

  const getCriteriaStatus = (criteria: string, assessment: MEDDPICCAssessment): { met: boolean; reason: string } => {
    switch (criteria) {
      case 'Pain identified':
        const painScore = assessment.pillarScores['identifyPain'] || 0
        return {
          met: painScore >= 50,
          reason: painScore >= 50 ? 'Pain points clearly identified' : 'Pain identification incomplete'
        }
      
      case 'Champion identified':
        const championScore = assessment.pillarScores['champion'] || 0
        return {
          met: championScore >= 50,
          reason: championScore >= 50 ? 'Champion identified and engaged' : 'Champion identification needed'
        }
      
      case 'Budget confirmed':
        const budgetScore = assessment.pillarScores['economicBuyer'] || 0
        return {
          met: budgetScore >= 50,
          reason: budgetScore >= 50 ? 'Budget authority confirmed' : 'Budget confirmation required'
        }
      
      case 'Economic buyer engaged':
        const economicBuyerScore = assessment.pillarScores['economicBuyer'] || 0
        return {
          met: economicBuyerScore >= 70,
          reason: economicBuyerScore >= 70 ? 'Economic buyer actively engaged' : 'Economic buyer engagement needed'
        }
      
      case 'Decision criteria established':
        const criteriaScore = assessment.pillarScores['decisionCriteria'] || 0
        return {
          met: criteriaScore >= 60,
          reason: criteriaScore >= 60 ? 'Decision criteria clearly defined' : 'Decision criteria need clarification'
        }
      
      case 'Decision process mapped':
        const processScore = assessment.pillarScores['decisionProcess'] || 0
        return {
          met: processScore >= 60,
          reason: processScore >= 60 ? 'Decision process fully mapped' : 'Decision process mapping incomplete'
        }
      
      case 'Paper process completed':
        const paperScore = assessment.pillarScores['paperProcess'] || 0
        return {
          met: paperScore >= 70,
          reason: paperScore >= 70 ? 'Paper process requirements met' : 'Paper process needs completion'
        }
      
      case 'Competition neutralized':
        const competitionScore = assessment.pillarScores['competition'] || 0
        return {
          met: competitionScore >= 70,
          reason: competitionScore >= 70 ? 'Competitive position secured' : 'Competitive threats remain'
        }
      
      case 'Champion committed':
        const championCommitmentScore = assessment.pillarScores['champion'] || 0
        return {
          met: championCommitmentScore >= 80,
          reason: championCommitmentScore >= 80 ? 'Champion fully committed' : 'Champion commitment needed'
        }
      
      default:
        return { met: false, reason: 'Unknown criteria' }
    }
  }

  const canAdvanceToStage = (targetStage: string): boolean => {
    if (!currentAssessment) return false
    
    const stageGate = getStageGateInfo(currentPEAKStage, targetStage)
    if (!stageGate) return false
    
    return stageGate.criteria.every(criteria => {
      const status = getCriteriaStatus(criteria, currentAssessment)
      return status.met
    })
  }

  const handleStageAdvance = async (targetStage: string) => {
    if (!canAdvanceToStage(targetStage)) return
    
    setIsAdvancing(true)
    try {
      if (onStageAdvance) {
        await onStageAdvance(currentPEAKStage, targetStage)
      }
    } catch (error) {
      console.error('Error advancing stage:', error)
    } finally {
      setIsAdvancing(false)
    }
  }

  const getNextStage = (currentStage: string): string | null => {
    const stageOrder = ['Prospecting', 'Engaging', 'Advancing', 'Key Decision']
    const currentIndex = stageOrder.indexOf(currentStage)
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null
  }

  const nextStage = getNextStage(currentPEAKStage)

  if (!currentAssessment || !nextStage) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No stage advancement available</p>
        </div>
      </div>
    )
  }

  const stageGate = getStageGateInfo(currentPEAKStage, nextStage)
  const canAdvance = canAdvanceToStage(nextStage)

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">PEAK Stage Gate</h3>
            <p className="text-sm text-gray-500">
              {currentPEAKStage} → {nextStage}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            canAdvance 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {canAdvance ? 'Ready to Advance' : 'Not Ready'}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Stage Gate Criteria */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Advancement Criteria</h4>
          <div className="space-y-3">
            {stageGate?.criteria.map((criteria, index) => {
              const status = getCriteriaStatus(criteria, currentAssessment)
              const StatusIcon = status.met ? CheckCircleIcon : XCircleIcon
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <StatusIcon className={`h-5 w-5 mt-0.5 ${status.met ? 'text-green-500' : 'text-red-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{criteria}</p>
                    <p className="text-xs text-gray-500">{status.reason}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MEDDPICC Score Impact */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">MEDDPICC Score Impact</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Current Score</p>
                <p className="text-lg font-medium text-gray-900">{currentAssessment.overallScore}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Qualification Level</p>
                <p className="text-lg font-medium text-gray-900">{currentAssessment.qualificationLevel}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${currentAssessment.overallScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Advancement */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Advance to {nextStage}</h4>
              <p className="text-xs text-gray-500">
                {canAdvance 
                  ? 'All criteria met - ready to advance' 
                  : 'Complete remaining criteria to advance'
                }
              </p>
            </div>
            <button
              onClick={() => handleStageAdvance(nextStage)}
              disabled={!canAdvance || isAdvancing}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                canAdvance
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
            >
              {isAdvancing ? (
                <>
                  <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                  Advancing...
                </>
              ) : (
                <>
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Advance Stage
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recommendations */}
        {!canAdvance && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Action Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete the following MEDDPICC assessments to advance to {nextStage}:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  {stageGate?.criteria.map((criteria, index) => {
                    const status = getCriteriaStatus(criteria, currentAssessment)
                    if (!status.met) {
                      return (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          {criteria}: {status.reason}
                        </li>
                      )
                    }
                    return null
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
