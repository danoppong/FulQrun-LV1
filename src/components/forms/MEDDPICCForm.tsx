'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { opportunityAPI } from '@/lib/api/opportunities'
import { MEDDPICCQualification } from '@/components/meddpicc'
import { MEDDPICCResponse, MEDDPICCAssessment, MEDDPICC_CONFIG, calculateMEDDPICCScore } from '@/lib/meddpicc'
import { meddpiccScoringService } from '@/lib/services/meddpicc-scoring'

const meddpiccSchema = z.object({
  metrics: z.string().optional(),
  economic_buyer: z.string().optional(),
  decision_criteria: z.string().optional(),
  decision_process: z.string().optional(),
  paper_process: z.string().optional(),
  identify_pain: z.string().optional(),
  implicate_pain: z.string().optional(),
  champion: z.string().optional(),
  competition: z.string().optional(),
})

type MEDDPICCFormData = z.infer<typeof meddpiccSchema>

interface MEDDPICCFormProps {
  opportunityId?: string
  initialData?: Partial<MEDDPICCFormData>
  onSave?: (data: MEDDPICCFormData) => void
  onSuccess?: () => void
  loading?: boolean
  useComprehensiveView?: boolean
}

export default function MEDDPICCForm({ 
  opportunityId,
  initialData = {}, 
  onSave, 
  onSuccess, 
  loading = false,
  useComprehensiveView = false
}: MEDDPICCFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessment, setAssessment] = useState<MEDDPICCAssessment | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MEDDPICCAssessment | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<MEDDPICCFormData>({
    resolver: zodResolver(meddpiccSchema),
    defaultValues: initialData
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const onSubmit = async (data: MEDDPICCFormData) => {
    setIsSubmitting(true)
    try {
      if (onSave) {
        onSave(data)
      }
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving MEDDPICC data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      // Get current form data
      const formData = {
        metrics: document.getElementById('metrics')?.value || '',
        economic_buyer: document.getElementById('economic_buyer')?.value || '',
        decision_criteria: document.getElementById('decision_criteria')?.value || '',
        decision_process: document.getElementById('decision_process')?.value || '',
        paper_process: document.getElementById('paper_process')?.value || '',
        identify_pain: document.getElementById('identify_pain')?.value || '',
        implicate_pain: document.getElementById('implicate_pain')?.value || '',
        champion: document.getElementById('champion')?.value || '',
        competition: document.getElementById('competition')?.value || ''
      }

      // Convert form data to MEDDPICC responses
      const responses: MEDDPICCResponse[] = []
      
      // Safety check for MEDDPICC_CONFIG
      if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
        console.warn('MEDDPICC_CONFIG not available for analysis')
        return
      }

      // Parse each pillar's text into individual responses
      for (const pillar of MEDDPICC_CONFIG.pillars) {
        const pillarText = formData[pillar.id as keyof typeof formData] || ''
        if (pillarText.trim()) {
          const pillarResponses = parsePillarText(pillarText, pillar.id)
          responses.push(...pillarResponses)
        }
      }

      // Calculate the assessment
      const assessment = calculateMEDDPICCScore(responses)
      setAnalysisResult(assessment)
      
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

  const handleAssessmentSave = (newAssessment: MEDDPICCAssessment) => {
    setAssessment(newAssessment)
    
    // Convert comprehensive assessment to legacy format for backward compatibility
    // We need to combine all responses for each pillar into a single text field
    const legacyData: MEDDPICCFormData = {
      metrics: combinePillarResponses(newAssessment.responses, 'metrics'),
      economic_buyer: combinePillarResponses(newAssessment.responses, 'economicBuyer'),
      decision_criteria: combinePillarResponses(newAssessment.responses, 'decisionCriteria'),
      decision_process: combinePillarResponses(newAssessment.responses, 'decisionProcess'),
      paper_process: combinePillarResponses(newAssessment.responses, 'paperProcess'),
      identify_pain: combinePillarResponses(newAssessment.responses, 'identifyPain'),
      implicate_pain: combinePillarResponses(newAssessment.responses, 'implicatePain'),
      champion: combinePillarResponses(newAssessment.responses, 'champion'),
      competition: combinePillarResponses(newAssessment.responses, 'competition')
    }
    
    console.log('Converting assessment to legacy format:', {
      assessment: newAssessment,
      legacyData: legacyData,
      responses: newAssessment.responses
    })
    
    if (onSave) {
      onSave(legacyData)
    }
    if (onSuccess) {
      onSuccess()
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

  // Convert simple MEDDPICC data to comprehensive format
  const convertToComprehensiveFormat = (simpleData: any): MEDDPICCResponse[] => {
    const responses: MEDDPICCResponse[] = []
    
    // Map simple field names to pillar IDs
    const pillarMap: Record<string, string> = {
      'metrics': 'metrics',
      'economic_buyer': 'economicBuyer',
      'decision_criteria': 'decisionCriteria',
      'decision_process': 'decisionProcess',
      'paper_process': 'paperProcess',
      'identify_pain': 'identifyPain',
      'implicate_pain': 'implicatePain',
      'champion': 'champion',
      'competition': 'competition'
    }
    
    Object.entries(simpleData).forEach(([key, value]) => {
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
      console.warn('MEDDPICC_CONFIG not available for parsing pillar text')
      return responses
    }
    
    const pillar = MEDDPICC_CONFIG.pillars.find(p => p.id === pillarId)
    
    if (!pillar) return responses
    
    // If text is empty, return empty array
    if (!text || text.trim().length === 0) return responses
    
    // Split by double newlines to get individual question-answer pairs
    const lines = text.split('\n\n').filter(line => line.trim().length > 0)
    
    // If no double newlines, treat the entire text as a single answer
    if (lines.length === 0 && text.trim().length > 0) {
      lines.push(text.trim())
    }
    
    lines.forEach((line, index) => {
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
        // If no colon found, treat the entire line as an answer to a question
        // Try to match with questions in order, or use the first question if no match
        const question = pillar.questions[index] || pillar.questions[0]
        if (question && line.trim()) {
          responses.push({
            pillarId,
            questionId: question.id,
            answer: line.trim(),
            points: 0
          })
        }
      }
    })
    
    return responses
  }

  // Use comprehensive view if requested and opportunityId is provided
  if (useComprehensiveView && opportunityId) {
    return (
      <MEDDPICCQualification
        opportunityId={opportunityId}
        initialData={convertToComprehensiveFormat(initialData)}
        onSave={handleAssessmentSave}
        onStageGateReady={(gate, isReady) => {
          console.log(`Stage gate ${gate} is ${isReady ? 'ready' : 'not ready'}`)
        }}
      />
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">MEDDPICC Qualification</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="metrics" className="block text-sm font-medium text-gray-700">
              Metrics
            </label>
            <textarea
              {...register('metrics')}
              id="metrics"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What metrics will be used to measure success?"
            />
            {errors.metrics && (
              <p className="mt-1 text-sm text-red-600">{errors.metrics.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="economic_buyer" className="block text-sm font-medium text-gray-700">
              Economic Buyer
            </label>
            <textarea
              {...register('economic_buyer')}
              id="economic_buyer"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who has the budget authority?"
            />
            {errors.economic_buyer && (
              <p className="mt-1 text-sm text-red-600">{errors.economic_buyer.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="decision_criteria" className="block text-sm font-medium text-gray-700">
              Decision Criteria
            </label>
            <textarea
              {...register('decision_criteria')}
              id="decision_criteria"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What criteria will be used to make the decision?"
            />
            {errors.decision_criteria && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_criteria.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="decision_process" className="block text-sm font-medium text-gray-700">
              Decision Process
            </label>
            <textarea
              {...register('decision_process')}
              id="decision_process"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="How will the decision be made?"
            />
            {errors.decision_process && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_process.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="paper_process" className="block text-sm font-medium text-gray-700">
              Paper Process
            </label>
            <textarea
              {...register('paper_process')}
              id="paper_process"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What paperwork/approvals are required?"
            />
            {errors.paper_process && (
              <p className="mt-1 text-sm text-red-600">{errors.paper_process.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="identify_pain" className="block text-sm font-medium text-gray-700">
              Identify Pain
            </label>
            <textarea
              {...register('identify_pain')}
              id="identify_pain"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What pain points are we solving?"
            />
            {errors.identify_pain && (
              <p className="mt-1 text-sm text-red-600">{errors.identify_pain.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="implicate_pain" className="block text-sm font-medium text-gray-700">
              Implicate Pain
            </label>
            <textarea
              {...register('implicate_pain')}
              id="implicate_pain"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="How can we help them understand the full impact of their pain?"
            />
            {errors.implicate_pain && (
              <p className="mt-1 text-sm text-red-600">{errors.implicate_pain.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="champion" className="block text-sm font-medium text-gray-700">
              Champion
            </label>
            <textarea
              {...register('champion')}
              id="champion"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who is our internal advocate?"
            />
            {errors.champion && (
              <p className="mt-1 text-sm text-red-600">{errors.champion.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="competition" className="block text-sm font-medium text-gray-700">
              Competition
            </label>
            <textarea
              {...register('competition')}
              id="competition"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who are we competing against?"
            />
            {errors.competition && (
              <p className="mt-1 text-sm text-red-600">{errors.competition.message}</p>
            )}
          </div>
        </div>

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

        <div className="flex justify-between">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading || isAnalyzing}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
          
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading || isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save MEDDPICC'}
          </button>
        </div>
      </div>
    </div>
  )
}
