'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  MEDDPICC_CONFIG, 
  MEDDPICCResponse, 
  MEDDPICCAssessment,
  calculateMEDDPICCScore,
  getMEDDPICCLevel
} from '@/lib/meddpicc'
import { opportunityAPI } from '@/lib/api/opportunities'
import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface MEDDPICCQualificationProps {
  opportunityId: string
  initialData?: Partial<MEDDPICCResponse[]>
  onSave?: (assessment: MEDDPICCAssessment) => void
  onStageGateReady?: (stageGate: string, isReady: boolean) => void
  className?: string
}

interface PillarFormData {
  [key: string]: string | number
}

export default function MEDDPICCQualification({
  opportunityId,
  initialData = [],
  onSave,
  onStageGateReady,
  className = ''
}: MEDDPICCQualificationProps) {
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set(['metrics']))
  const [currentAssessment, setCurrentAssessment] = useState<MEDDPICCAssessment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responses, setResponses] = useState<MEDDPICCResponse[]>(initialData)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PillarFormData>({
    resolver: zodResolver(z.object({})), // Dynamic validation
    defaultValues: {}
  })

  const watchedValues = watch()

  useEffect(() => {
    // Calculate assessment whenever responses change
    if (responses.length > 0) {
      const assessment = calculateMEDDPICCScore(responses)
      setCurrentAssessment(assessment)
      
      // Notify parent about stage gate readiness (only when assessment changes)
      if (onStageGateReady && currentAssessment?.overallScore !== assessment.overallScore) {
        Object.entries(assessment.stageGateReadiness).forEach(([gate, isReady]) => {
          onStageGateReady(gate, isReady)
        })
      }
    }
  }, [responses]) // Removed onStageGateReady from dependencies to prevent infinite loops

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pillarId)) {
        newSet.delete(pillarId)
      } else {
        newSet.add(pillarId)
      }
      return newSet
    })
  }

  const handleQuestionChange = (pillarId: string, questionId: string, answer: string | number, points?: number) => {
    const newResponses = responses.filter(r => !(r.pillarId === pillarId && r.questionId === questionId))
    
    if (answer !== '' && answer !== null && answer !== undefined) {
      newResponses.push({
        pillarId,
        questionId,
        answer,
        points
      })
    }
    
    setResponses(newResponses)
  }

  const onSubmit = async (data: PillarFormData) => {
    setIsSubmitting(true)
    try {
      if (currentAssessment) {
        // Save to opportunity
        await opportunityAPI.updateMEDDPICC(opportunityId, {
          metrics: responses.find(r => r.pillarId === 'metrics' && r.questionId === 'current_cost')?.answer as string || '',
          economic_buyer: responses.find(r => r.pillarId === 'economicBuyer' && r.questionId === 'budget_authority')?.answer as string || '',
          decision_criteria: responses.find(r => r.pillarId === 'decisionCriteria' && r.questionId === 'key_criteria')?.answer as string || '',
          decision_process: responses.find(r => r.pillarId === 'decisionProcess' && r.questionId === 'process_steps')?.answer as string || '',
          paper_process: responses.find(r => r.pillarId === 'paperProcess' && r.questionId === 'documentation')?.answer as string || '',
          identify_pain: responses.find(r => r.pillarId === 'identifyPain' && r.questionId === 'biggest_challenge')?.answer as string || '',
          champion: responses.find(r => r.pillarId === 'champion' && r.questionId === 'champion_identity')?.answer as string || '',
          competition: responses.find(r => r.pillarId === 'competition' && r.questionId === 'competitors')?.answer as string || ''
        })

        if (onSave) {
          onSave(currentAssessment)
        }
      }
    } catch (error) {
      console.error('Error saving MEDDPICC assessment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPillarProgress = (pillarId: string): number => {
    const pillarResponses = responses.filter(r => r.pillarId === pillarId)
    const pillar = MEDDPICC_CONFIG.pillars.find(p => p.id === pillarId)
    if (!pillar) return 0
    
    const totalQuestions = pillar.questions.length
    const answeredQuestions = pillarResponses.length
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  const renderQuestion = (pillarId: string, question: any) => {
    const currentResponse = responses.find(r => r.pillarId === pillarId && r.questionId === question.id)
    const currentAnswer = currentResponse?.answer || ''

    switch (question.type) {
      case 'text':
        return (
          <textarea
            {...register(`${pillarId}_${question.id}`)}
            value={currentAnswer}
            onChange={(e) => handleQuestionChange(pillarId, question.id, e.target.value)}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            placeholder={`Enter your response...`}
          />
        )
      
      case 'scale':
      case 'yes_no':
        return (
          <div className="mt-1 space-y-2">
            {question.answers?.map((answer: any, index: number) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`${pillarId}_${question.id}`}
                  value={answer.text}
                  checked={currentAnswer === answer.text}
                  onChange={() => handleQuestionChange(pillarId, question.id, answer.text, answer.points)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-sm">{answer.text}</span>
              </label>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header with Overall Score */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">MEDDPICC Qualification</h3>
            <p className="text-sm text-gray-500">Comprehensive sales qualification assessment</p>
          </div>
          {currentAssessment && (
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getMEDDPICCLevel(currentAssessment.overallScore).color
              } text-white`}>
                {currentAssessment.overallScore}% - {currentAssessment.qualificationLevel}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Litmus Test: {currentAssessment.litmusTestScore}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pillars */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {MEDDPICC_CONFIG.pillars.map((pillar) => {
            const isExpanded = expandedPillars.has(pillar.id)
            const progress = getPillarProgress(pillar.id)
            
            return (
              <div key={pillar.id} className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => togglePillar(pillar.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{pillar.icon}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{pillar.displayName}</h4>
                      <p className="text-xs text-gray-500">{pillar.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{progress}%</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${pillar.color}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="space-y-4 pt-4">
                      {pillar.questions.map((question) => (
                        <div key={question.id}>
                          <label className="block text-sm font-medium text-gray-700">
                            {question.text}
                            {question.tooltip && (
                              <InformationCircleIcon className="inline h-4 w-4 ml-1 text-gray-400" title={question.tooltip} />
                            )}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderQuestion(pillar.id, question)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Litmus Test */}
        <div className="mt-6 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-yellow-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <span className="text-yellow-600 mr-2">⚡</span>
              {MEDDPICC_CONFIG.litmusTest.displayName}
            </h4>
            <p className="text-xs text-gray-500 mt-1">Final qualification gate</p>
          </div>
          <div className="px-4 py-4">
            <div className="space-y-4">
              {MEDDPICC_CONFIG.litmusTest.questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestion('litmus', question)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Actions */}
        {currentAssessment && currentAssessment.nextActions.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Recommended Next Actions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {currentAssessment.nextActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stage Gate Readiness */}
        {currentAssessment && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">PEAK Stage Gate Readiness</h4>
            <div className="space-y-2">
              {Object.entries(currentAssessment.stageGateReadiness).map(([gate, isReady]) => (
                <div key={gate} className="flex items-center justify-between">
                  <span className="text-sm text-green-800">{gate.replace('_to_', ' → ')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isReady 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save MEDDPICC Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}
