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
import { meddpiccScoringService } from '@/lib/services/meddpicc-scoring'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MEDDPICCAssessment | null>(null)
  const [responses, setResponses] = useState<MEDDPICCResponse[]>(initialData.filter((item): item is MEDDPICCResponse => item !== undefined))

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

  // Check if MEDDPICC_CONFIG is available
  useEffect(() => {
    if (MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars) {
      setIsLoading(false)
    } else {
      console.warn('MEDDPICC_CONFIG not available, retrying...')
      // Retry after a short delay
      const timer = setTimeout(() => {
        if (MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars) {
          setIsLoading(false)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Convert legacy MEDDPICC data to comprehensive format
  const convertLegacyToComprehensive = (legacyData: any): MEDDPICCResponse[] => {
    const responses: MEDDPICCResponse[] = []
    
    // Map simple field names to pillar IDs
    const pillarMap: Record<string, string> = {
      'metrics': 'metrics',
      'economic_buyer': 'economicBuyer',
      'decision_criteria': 'decisionCriteria',
      'decision_process': 'decisionProcess',
      'paper_process': 'paperProcess',
      'identify_pain': 'identifyPain',
      'champion': 'champion',
      'competition': 'competition'
    }
    
    Object.entries(legacyData).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const pillarId = pillarMap[key]
        if (pillarId) {
          // Try to parse the combined text back into individual responses
          const parsedResponses = parsePillarText(value, pillarId)
          responses.push(...parsedResponses)
        }
      }
    })
    
    return responses
  }

  // Helper function to parse combined pillar text back into individual responses
  const parsePillarText = (text: string, pillarId: string): MEDDPICCResponse[] => {
    const responses: MEDDPICCResponse[] = []
    
    // Safety check for MEDDPICC_CONFIG
    if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
      console.warn('MEDDPICC_CONFIG not available')
      return responses
    }
    
    const pillar = MEDDPICC_CONFIG.pillars.find(p => p.id === pillarId)
    
    if (!pillar) return responses
    
    // Split by double newlines to get individual question-answer pairs
    const lines = text.split('\n\n').filter(line => line.trim().length > 0)
    
    lines.forEach(line => {
      // Look for pattern "Question: Answer"
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const questionText = line.substring(0, colonIndex).trim()
        const answer = line.substring(colonIndex + 1).trim()
        
        // Find the matching question in the pillar
        const question = pillar.questions.find(q => q.text === questionText)
        if (question && answer) {
          responses.push({
            pillarId,
            questionId: question.id,
            answer,
            points: 0 // Will be calculated by the scoring function
          })
        }
      } else {
        // If no colon found, treat the entire line as an answer to the first question
        const firstQuestion = pillar.questions[0]
        if (firstQuestion && line.trim()) {
          responses.push({
            pillarId,
            questionId: firstQuestion.id,
            answer: line.trim(),
            points: 0
          })
        }
      }
    })
    
    return responses
  }

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
        // Save to opportunity - combine all responses for each pillar
        const meddpiccData = {
          metrics: combinePillarResponses(responses, 'metrics'),
          economic_buyer: combinePillarResponses(responses, 'economicBuyer'),
          decision_criteria: combinePillarResponses(responses, 'decisionCriteria'),
          decision_process: combinePillarResponses(responses, 'decisionProcess'),
          paper_process: combinePillarResponses(responses, 'paperProcess'),
          identify_pain: combinePillarResponses(responses, 'identifyPain'),
          champion: combinePillarResponses(responses, 'champion'),
          competition: combinePillarResponses(responses, 'competition')
        }
        
        console.log('Saving MEDDPICC data:', meddpiccData)
        console.log('All responses:', responses)
        
        await opportunityAPI.updateMEDDPICC(opportunityId, meddpiccData)

        // Update the MEDDPICC score in the database using the unified service
        if (currentAssessment) {
          await meddpiccScoringService.updateOpportunityScore(opportunityId, currentAssessment)
        }

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

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      console.log('Running MEDDPICC Analysis with responses:', responses)

      // Calculate the assessment using current responses
      const assessment = calculateMEDDPICCScore(responses)
      setAnalysisResult(assessment)
      setCurrentAssessment(assessment)
      
      // Update the MEDDPICC score in the database
      await meddpiccScoringService.updateOpportunityScore(opportunityId, assessment)
      
      console.log('Analysis completed:', {
        overallScore: assessment.overallScore,
        qualificationLevel: assessment.qualificationLevel,
        pillarScores: assessment.pillarScores
      })

    } catch (error) {
      console.error('Error running MEDDPICC analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper function to combine all responses for a pillar into a single text
  const combinePillarResponses = (responses: MEDDPICCResponse[], pillarId: string): string => {
    const pillarResponses = responses.filter(r => r.pillarId === pillarId)
    if (pillarResponses.length === 0) return ''
    
    // Safety check for MEDDPICC_CONFIG
    if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
      console.warn('MEDDPICC_CONFIG not available for combining responses')
      return pillarResponses.map(r => r.answer).join('\n\n')
    }
    
    // Combine all responses for this pillar into a readable format
    return pillarResponses
      .map(response => {
        const question = MEDDPICC_CONFIG.pillars
          .find(p => p.id === pillarId)
          ?.questions.find(q => q.id === response.questionId)
        
        if (!question || !response.answer) return ''
        
        return `${question.text}: ${response.answer}`
      })
      .filter(text => text.length > 0)
      .join('\n\n')
  }

  const getPillarProgress = (pillarId: string): number => {
    const pillarResponses = responses.filter(r => r.pillarId === pillarId)
    
    // Safety check for MEDDPICC_CONFIG
    if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
      return 0
    }
    
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

  // Show loading state if MEDDPICC_CONFIG is not available
  if (isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading MEDDPICC configuration...</span>
          </div>
        </div>
      </div>
    )
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
          {MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars ? MEDDPICC_CONFIG.pillars.map((pillar) => {
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
          }) : (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading MEDDPICC configuration...</p>
            </div>
          )}
        </div>

        {/* Litmus Test */}
        {MEDDPICC_CONFIG && MEDDPICC_CONFIG.litmusTest && (
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
        )}

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

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-3">📊 MEDDPICC Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Score:</span>
                  <span className={`text-sm font-bold ${
                    analysisResult.overallScore >= 80 ? 'text-green-600' :
                    analysisResult.overallScore >= 60 ? 'text-blue-600' :
                    analysisResult.overallScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analysisResult.overallScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Qualification Level:</span>
                  <span className={`text-sm font-bold ${
                    analysisResult.qualificationLevel === 'excellent' ? 'text-green-600' :
                    analysisResult.qualificationLevel === 'good' ? 'text-blue-600' :
                    analysisResult.qualificationLevel === 'fair' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analysisResult.qualificationLevel.charAt(0).toUpperCase() + analysisResult.qualificationLevel.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Litmus Test:</span>
                  <span className="text-sm font-bold text-gray-600">
                    {analysisResult.litmusTestScore}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Pillar Scores:</h4>
                <div className="space-y-1">
                  {Object.entries(analysisResult.pillarScores).map(([pillarId, score]) => {
                    const pillar = MEDDPICC_CONFIG?.pillars?.find(p => p.id === pillarId)
                    return (
                      <div key={pillarId} className="flex justify-between text-xs">
                        <span className="text-gray-600">{pillar?.displayName || pillarId}:</span>
                        <span className={`font-medium ${
                          score >= 80 ? 'text-green-600' :
                          score >= 60 ? 'text-blue-600' :
                          score >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {score}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {analysisResult.nextActions && analysisResult.nextActions.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Next Actions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysisResult.nextActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
          
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
