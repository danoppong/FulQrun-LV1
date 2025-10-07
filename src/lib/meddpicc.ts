export interface MEDDPICCQuestion {
  id: string
  text: string
  tooltip?: string
  type: 'text' | 'scale' | 'multiple_choice' | 'yes_no'
  answers?: {
    text: string
    points: number
  }[]
  required: boolean
}

export interface MEDDPICCPillar {
  id: string
  displayName: string
  description: string
  weight: number
  questions: MEDDPICCQuestion[]
  icon?: string
  color?: string
}

export interface MEDDPICCThresholds {
  excellent: number
  good: number
  fair: number
  poor: number
}

export interface MEDDPICCLitmusTest {
  displayName: string
  questions: MEDDPICCQuestion[]
}

export interface MEDDPICCConfig {
  projectName: string
  version: string
  framework: string
  scoring: {
    weights: Record<string, number>
    thresholds: MEDDPICCThresholds
  }
  pillars: MEDDPICCPillar[]
  litmusTest: MEDDPICCLitmusTest
  integrations: {
    peakPipeline: {
      stageGates: Array<{
        from: string
        to: string
        criteria: string[]
      }>
    }
    crmOpportunity: {
      componentTarget: string
      headerFields: string[]
    }
  }
  admin: {
    configurableElements: string[]
  }
}

export const MEDDPICC_CONFIG: MEDDPICCConfig = {
  projectName: "CRM Integration of the MEDDPICC & PEAK Sales Qualification Module",
  version: "1.0",
  framework: "MEDD(I)PICC",
  scoring: {
    weights: {
      metrics: 15,
      economicBuyer: 20,
      decisionCriteria: 10,
      decisionProcess: 15,
      paperProcess: 5,
      identifyPain: 20,
      implicatePain: 20,
      champion: 10,
      competition: 5
    },
    thresholds: {
      excellent: 80,
      good: 60,
      fair: 40,
      poor: 20
    }
  },
  pillars: [
    {
      id: 'metrics',
      displayName: 'Metrics',
      description: 'Quantify the business impact and ROI',
      weight: 15,
      icon: '📊',
      color: 'bg-blue-100 text-blue-800',
      questions: [
        {
          id: 'current_cost',
          text: 'What is the current cost of the problem?',
          tooltip: 'Quantify the financial impact of the current situation',
          type: 'text',
          required: true
        },
        {
          id: 'expected_roi',
          text: 'What is the expected ROI from solving this problem?',
          tooltip: 'Calculate the return on investment',
          type: 'text',
          required: true
        },
        {
          id: 'success_metrics',
          text: 'How will success be measured?',
          tooltip: 'Define specific KPIs and success criteria',
          type: 'text',
          required: true
        },
        {
          id: 'urgency_level',
          text: 'How urgent is this problem?',
          tooltip: 'Rate the urgency of solving this problem',
          type: 'scale',
          answers: [
            { text: 'Critical (Must solve immediately)', points: 10 },
            { text: 'High (Solve within 3 months)', points: 8 },
            { text: 'Medium (Solve within 6 months)', points: 6 },
            { text: 'Low (Solve within 12 months)', points: 4 },
            { text: 'Not urgent', points: 2 }
          ],
          required: true
        }
      ]
    },
    {
      id: 'economicBuyer',
      displayName: 'Economic Buyer',
      description: 'Identify the person who can approve the budget',
      weight: 20,
      icon: '💰',
      color: 'bg-green-100 text-green-800',
      questions: [
        {
          id: 'budget_authority',
          text: 'Who has the authority to approve this purchase?',
          tooltip: 'Identify the person with budget approval power',
          type: 'text',
          required: true
        },
        {
          id: 'influence_level',
          text: 'What is their role and influence level?',
          tooltip: 'Assess their position and decision-making power',
          type: 'text',
          required: true
        },
        {
          id: 'meeting_status',
          text: 'Have we met with the economic buyer?',
          tooltip: 'Confirm direct engagement with budget holder',
          type: 'yes_no',
          answers: [
            { text: 'Yes - Multiple meetings', points: 10 },
            { text: 'Yes - One meeting', points: 7 },
            { text: 'No - Scheduled', points: 4 },
            { text: 'No - Not identified', points: 0 }
          ],
          required: true
        },
        {
          id: 'budget_range',
          text: 'What is their budget authority?',
          tooltip: 'Understand their spending limits',
          type: 'text',
          required: true
        }
      ]
    },
    {
      id: 'decisionCriteria',
      displayName: 'Decision Criteria',
      description: 'Understand how they will evaluate solutions',
      weight: 10,
      icon: '📋',
      color: 'bg-purple-100 text-purple-800',
      questions: [
        {
          id: 'key_criteria',
          text: 'What are their key decision criteria?',
          tooltip: 'List the main factors they will use to evaluate solutions',
          type: 'text',
          required: true
        },
        {
          id: 'criteria_importance',
          text: 'How important is each criterion?',
          tooltip: 'Rank the criteria by importance',
          type: 'text',
          required: true
        },
        {
          id: 'must_haves',
          text: 'What are their must-haves vs nice-to-haves?',
          tooltip: 'Distinguish between essential and optional features',
          type: 'text',
          required: true
        }
      ]
    },
    {
      id: 'decisionProcess',
      displayName: 'Decision Process',
      description: 'Map the approval workflow and timeline',
      weight: 15,
      icon: '⚙️',
      color: 'bg-orange-100 text-orange-800',
      questions: [
        {
          id: 'process_steps',
          text: 'What is their decision-making process?',
          tooltip: 'Outline the steps in their decision process',
          type: 'text',
          required: true
        },
        {
          id: 'stakeholders',
          text: 'Who else needs to be involved?',
          tooltip: 'Identify all decision influencers',
          type: 'text',
          required: true
        },
        {
          id: 'timeline',
          text: 'What is the timeline for decision?',
          tooltip: 'Establish decision timeline and milestones',
          type: 'text',
          required: true
        }
      ]
    },
    {
      id: 'paperProcess',
      displayName: 'Paper Process',
      description: 'Document requirements and procurement process',
      weight: 5,
      icon: '📄',
      color: 'bg-gray-100 text-gray-800',
      questions: [
        {
          id: 'documentation',
          text: 'What documentation is required?',
          tooltip: 'List all required documents and forms',
          type: 'text',
          required: true
        },
        {
          id: 'procurement',
          text: 'What is their procurement process?',
          tooltip: 'Understand their purchasing procedures',
          type: 'text',
          required: true
        },
        {
          id: 'compliance',
          text: 'Are there any compliance requirements?',
          tooltip: 'Identify regulatory or policy requirements',
          type: 'text',
          required: false
        }
      ]
    },
    {
      id: 'identifyPain',
      displayName: 'Identify Pain',
      description: 'Understand their pain points and challenges',
      weight: 20,
      icon: '😰',
      color: 'bg-red-100 text-red-800',
      questions: [
        {
          id: 'biggest_challenge',
          text: 'What is their biggest challenge?',
          tooltip: 'Identify the primary pain point',
          type: 'text',
          required: true
        },
        {
          id: 'consequences',
          text: 'What happens if they don\'t solve this?',
          tooltip: 'Understand the impact of inaction',
          type: 'text',
          required: true
        },
        {
          id: 'previous_attempts',
          text: 'What have they tried before?',
          tooltip: 'Learn from their past solutions',
          type: 'text',
          required: true
        }
      ]
    },
    {
      id: 'implicatePain',
      displayName: 'Implicate Pain',
      description: 'Help them understand the full impact of their pain',
      weight: 20,
      icon: '💡',
      color: 'bg-yellow-100 text-yellow-800',
      questions: [
        {
          id: 'pain_amplification',
          text: 'How can we help them understand the full impact?',
          tooltip: 'Strategies to amplify pain recognition',
          type: 'text',
          required: true
        },
        {
          id: 'urgency_creation',
          text: 'What creates urgency for them?',
          tooltip: 'Identify what motivates immediate action',
          type: 'text',
          required: true
        },
        {
          id: 'stakeholder_impact',
          text: 'Who else is affected by this pain?',
          tooltip: 'Map pain impact across stakeholders',
          type: 'text',
          required: true
        }
      ]
    },
    {
      id: 'champion',
      displayName: 'Champion',
      description: 'Find internal advocate who will support you',
      weight: 10,
      icon: '🏆',
      color: 'bg-indigo-100 text-indigo-800',
      questions: [
        {
          id: 'champion_identity',
          text: 'Who is our internal champion?',
          tooltip: 'Identify the person who will advocate for us',
          type: 'text',
          required: true
        },
        {
          id: 'champion_influence',
          text: 'What is their influence level?',
          tooltip: 'Assess their power and influence in the organization',
          type: 'scale',
          answers: [
            { text: 'Very High (C-Level)', points: 10 },
            { text: 'High (VP/Director)', points: 8 },
            { text: 'Medium (Manager)', points: 6 },
            { text: 'Low (Individual Contributor)', points: 4 },
            { text: 'Unknown', points: 2 }
          ],
          required: true
        },
        {
          id: 'champion_commitment',
          text: 'How committed are they to our solution?',
          tooltip: 'Measure their level of commitment',
          type: 'scale',
          answers: [
            { text: 'Fully committed', points: 10 },
            { text: 'Strongly supportive', points: 8 },
            { text: 'Moderately supportive', points: 6 },
            { text: 'Neutral', points: 4 },
            { text: 'Not committed', points: 2 }
          ],
          required: true
        }
      ]
    },
    {
      id: 'competition',
      displayName: 'Competition',
      description: 'Assess competitive landscape and positioning',
      weight: 5,
      icon: '⚔️',
      color: 'bg-pink-100 text-pink-800',
      questions: [
        {
          id: 'competitors',
          text: 'Who else are they considering?',
          tooltip: 'Identify competing solutions',
          type: 'text',
          required: true
        },
        {
          id: 'competitive_advantages',
          text: 'What are our competitive advantages?',
          tooltip: 'Define our unique value proposition',
          type: 'text',
          required: true
        },
        {
          id: 'differentiation',
          text: 'How do we differentiate ourselves?',
          tooltip: 'Explain what makes us different',
          type: 'text',
          required: true
        },
        {
          id: 'win_probability',
          text: 'What is our win probability?',
          tooltip: 'Assess likelihood of winning',
          type: 'scale',
          answers: [
            { text: 'Very High (90%+)', points: 10 },
            { text: 'High (70-89%)', points: 8 },
            { text: 'Medium (50-69%)', points: 6 },
            { text: 'Low (30-49%)', points: 4 },
            { text: 'Very Low (<30%)', points: 2 }
          ],
          required: true
        }
      ]
    }
  ],
  litmusTest: {
    displayName: 'Final Qualification Gate',
    questions: [
      {
        id: 'budget_confirmed',
        text: 'Is budget confirmed and available?',
        type: 'yes_no',
        answers: [
          { text: 'Yes - Budget approved', points: 10 },
          { text: 'Yes - Budget allocated', points: 8 },
          { text: 'Yes - Budget identified', points: 6 },
          { text: 'No - Budget unclear', points: 2 }
        ],
        required: true
      },
      {
        id: 'decision_timeline',
        text: 'Is there a clear decision timeline?',
        type: 'yes_no',
        answers: [
          { text: 'Yes - Specific date', points: 10 },
          { text: 'Yes - General timeframe', points: 7 },
          { text: 'No - Timeline unclear', points: 3 }
        ],
        required: true
      },
      {
        id: 'champion_confirmed',
        text: 'Do we have a confirmed champion?',
        type: 'yes_no',
        answers: [
          { text: 'Yes - Strong champion', points: 10 },
          { text: 'Yes - Moderate champion', points: 7 },
          { text: 'No - No champion', points: 2 }
        ],
        required: true
      }
    ]
  },
  integrations: {
    peakPipeline: {
      stageGates: [
        {
          from: 'Prospecting',
          to: 'Engaging',
          criteria: ['Pain identified', 'Champion identified', 'Budget confirmed']
        },
        {
          from: 'Engaging',
          to: 'Advancing',
          criteria: ['Economic buyer engaged', 'Decision criteria established', 'Decision process mapped']
        },
        {
          from: 'Advancing',
          to: 'Key Decision',
          criteria: ['Paper process completed', 'Competition neutralized', 'Champion committed']
        }
      ]
    },
    crmOpportunity: {
      componentTarget: 'Opportunity.PageLayout.MainColumn',
      headerFields: ['MEDDPICC Score', 'Qualification Status', 'Next Actions']
    }
  },
  admin: {
    configurableElements: ['questions.text', 'questions.tooltip', 'answers.text', 'answers.points', 'scoring.weights']
  }
}

// Legacy support - keep existing interface for backward compatibility
export interface MEDDPICCField {
  id: string
  name: string
  description: string
  weight: number
  questions: string[]
}

// Legacy MEDDPICC fields for backward compatibility
export const MEDDPICC_FIELDS: MEDDPICCField[] = [
  { id: 'metrics', name: 'Metrics', description: 'Quantify the business impact', weight: 15, questions: ['What is the current cost?', 'What is the potential savings?'] },
  { id: 'economic_buyer', name: 'Economic Buyer', description: 'Identify the decision maker', weight: 20, questions: ['Who has budget authority?', 'What is their influence level?'] },
  { id: 'decision_criteria', name: 'Decision Criteria', description: 'Understand evaluation process', weight: 10, questions: ['What are the key criteria?', 'How will success be measured?'] },
  { id: 'decision_process', name: 'Decision Process', description: 'Map approval workflow', weight: 15, questions: ['What are the process steps?', 'Who needs to approve?'] },
  { id: 'paper_process', name: 'Paper Process', description: 'Document requirements', weight: 5, questions: ['What documentation is needed?', 'What are the procurement steps?'] },
  { id: 'identify_pain', name: 'Identify Pain', description: 'Understand pain points', weight: 20, questions: ['What is the biggest challenge?', 'What are the consequences?'] },
  { id: 'champion', name: 'Champion', description: 'Find internal advocate', weight: 10, questions: ['Who is your champion?', 'What is their commitment level?'] },
  { id: 'competition', name: 'Competition', description: 'Assess competitive landscape', weight: 5, questions: ['Who are the competitors?', 'What is our differentiation?'] }
]

export interface MEDDPICCResponse {
  pillarId: string
  questionId: string
  answer: string | number
  points?: number
}

export interface MEDDPICCAssessment {
  responses: MEDDPICCResponse[]
  pillarScores: Record<string, number>
  overallScore: number
  qualificationLevel: string
  litmusTestScore: number
  nextActions: string[]
  stageGateReadiness: Record<string, boolean>
}

export const calculateMEDDPICCScore = (responses: MEDDPICCResponse[]): MEDDPICCAssessment => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.log('=== MEDDPICC Scoring Debug ===')
    console.log('Input responses:', responses)
    console.log('MEDDPICC_CONFIG available:', !!MEDDPICC_CONFIG)
    console.log('MEDDPICC_CONFIG pillars:', MEDDPICC_CONFIG?.pillars?.length)
  }
  
  // Safety check for MEDDPICC_CONFIG
  if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
    console.warn('MEDDPICC_CONFIG not available for scoring')
    return {
      responses,
      pillarScores: {},
      overallScore: 0,
      qualificationLevel: 'poor',
      litmusTestScore: 0,
      nextActions: ['Configuration not available - please refresh the page'],
      stageGateReadiness: {}
    }
  }

  const pillarScores: Record<string, number> = {}
  const pillarMaxScores: Record<string, number> = {}
  const _litmusTestResponses: MEDDPICCResponse[] = []
  
  // Calculate pillar scores using improved algorithm
  for (const pillar of MEDDPICC_CONFIG.pillars) {
    let pillarScore = 0
    let pillarMaxScore = 0
    let _answeredQuestions = 0
    const totalQuestions = pillar.questions.length
    
    if (isDevelopment) {
      console.log(`\n--- Processing Pillar: ${pillar.id} ---`)
      console.log('Pillar questions:', pillar.questions.map(q => ({ id: q.id, text: q.text })))
      console.log('Available responses for this pillar:', responses.filter(r => r.pillarId === pillar.id))
    }
    
    for (const question of pillar.questions) {
      const response = responses.find(r => r.pillarId === pillar.id && r.questionId === question.id)
      if (isDevelopment) {
        console.log(`Looking for response to question ${question.id}:`, response)
      }
      
      if (response && response.answer && response.answer.toString().trim().length > 0) {
        _answeredQuestions++
        
        if (question.type === 'text') {
          // Text responses: Score based on content quality and completeness
          const answerText = response.answer.toString().trim()
          let points = 0
          
          // More generous scoring for any non-empty response
          if (answerText.length > 0) points += 3  // Any content gets base points
          if (answerText.length >= 3) points += 2  // Minimum meaningful content
          if (answerText.length >= 10) points += 2 // Good detail
          if (answerText.length >= 25) points += 2 // Comprehensive
          if (answerText.length >= 50) points += 1 // Very detailed
          
          // Bonus points for specific keywords that indicate quality answers
          const qualityKeywords = ['specific', 'measurable', 'quantified', 'roi', 'impact', 'cost', 'savings', 'efficiency', 'revenue', 'profit', 'test', 'quality', 'improvement', 'lives', 'saved']
          const keywordCount = qualityKeywords.filter(keyword => 
            answerText.toLowerCase().includes(keyword)
          ).length
          points += Math.min(keywordCount, 2) // Max 2 bonus points
          
          // Cap at 10 points per question
          points = Math.min(points, 10)
          pillarScore += points
          pillarMaxScore += 10
          
          console.log(`Points awarded: ${points}, pillar score now: ${pillarScore}`)
          
        } else if (question.type === 'scale' || question.type === 'yes_no') {
          // Scale and yes/no responses use predefined points
          const points = response.points || 0
          pillarScore += points
          pillarMaxScore += 10
        }
      } else {
        // Missing or empty responses get 0 points
        pillarMaxScore += 10
      }
    }
    
    // Calculate pillar score as percentage of answered questions
    // If no questions answered, score is 0
    if (totalQuestions === 0) {
      pillarScores[pillar.id] = 0
      pillarMaxScores[pillar.id] = 0
      console.log(`Pillar ${pillar.id} final: 0% (no questions)`)
    } else {
      // Normalize score to percentage (0-100)
      const normalizedScore = pillarMaxScore > 0 ? (pillarScore / pillarMaxScore) * 100 : 0
      pillarScores[pillar.id] = Math.round(normalizedScore)
      pillarMaxScores[pillar.id] = 100
      if (isDevelopment) {
        console.log(`Pillar ${pillar.id} final: ${pillarScore}/${pillarMaxScore} = ${Math.round(normalizedScore)}%`)
      }
    }
  }
  
  // Calculate litmus test score
  let litmusScore = 0
  let litmusMaxScore = 0
  
  if (MEDDPICC_CONFIG.litmusTest && MEDDPICC_CONFIG.litmusTest.questions) {
    for (const question of MEDDPICC_CONFIG.litmusTest.questions) {
      const response = responses.find(r => r.pillarId === 'litmus' && r.questionId === question.id)
      if (response) {
        const points = response.points || 0
        litmusScore += points
        litmusMaxScore += 10
      } else {
        litmusMaxScore += 10
      }
    }
  }
  
  // Calculate weighted overall score using the improved algorithm
  let totalWeightedScore = 0
  let totalWeight = 0
  
  if (isDevelopment) {
    console.log('\n=== Overall Score Calculation ===')
    console.log('Pillar scores:', pillarScores)
  }
  
  for (const pillar of MEDDPICC_CONFIG.pillars) {
    const pillarScore = pillarScores[pillar.id] || 0  // Already normalized to 0-100
    const pillarWeight = pillar.weight
    
    // Apply pillar weight to the score
    const weightedScore = (pillarScore / 100) * pillarWeight
    totalWeightedScore += weightedScore
    totalWeight += pillarWeight
    
    if (isDevelopment) {
      console.log(`Pillar ${pillar.id}: ${pillarScore}% × ${pillarWeight} = ${weightedScore.toFixed(2)}`)
    }
  }
  
  // Calculate final score as percentage of total possible weighted score
  const overallScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0
  const litmusTestScore = Math.round((litmusScore / litmusMaxScore) * 100)
  
  if (isDevelopment) {
    console.log(`Total weighted score: ${totalWeightedScore.toFixed(2)}`)
    console.log(`Total weight: ${totalWeight}`)
    console.log(`Overall score: ${overallScore}%`)
  }
  
  // Determine qualification level
  const qualificationLevel = getMEDDPICCLevel(overallScore).level
  
  // Generate next actions based on low-scoring pillars
  const nextActions = generateNextActions(pillarScores, pillarMaxScores)
  
  // Check stage gate readiness
  const stageGateReadiness = checkStageGateReadiness(responses, pillarScores)
  
  return {
    responses,
    pillarScores,
    overallScore,
    qualificationLevel,
    litmusTestScore,
    nextActions,
    stageGateReadiness
  }
}

export const getMEDDPICCLevel = (score: number): { level: string; color: string; description: string } => {
  // Safety check for MEDDPICC_CONFIG
  if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.scoring || !MEDDPICC_CONFIG.scoring.thresholds) {
    console.warn('MEDDPICC_CONFIG not available for level calculation')
    return {
      level: 'poor',
      color: 'text-red-600',
      description: 'Unable to determine qualification level'
    }
  }
  
  const thresholds = MEDDPICC_CONFIG.scoring.thresholds
  
  if (score >= thresholds.excellent) {
    return {
      level: 'Excellent',
      color: 'bg-green-500',
      description: 'High probability of closing - all key areas covered'
    }
  } else if (score >= thresholds.good) {
    return {
      level: 'Good',
      color: 'bg-blue-500',
      description: 'Good qualification - some areas need attention'
    }
  } else if (score >= thresholds.fair) {
    return {
      level: 'Fair',
      color: 'bg-yellow-500',
      description: 'Moderate qualification - several areas need work'
    }
  } else {
    return {
      level: 'Poor',
      color: 'bg-red-500',
      description: 'Low qualification - significant gaps to address'
    }
  }
}

function generateNextActions(pillarScores: Record<string, number>, pillarMaxScores: Record<string, number>): string[] {
  // Safety check for MEDDPICC_CONFIG
  if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
    console.warn('MEDDPICC_CONFIG not available for next actions')
    return ['Configuration not available - please refresh the page']
  }
  
  const actions: string[] = []
  
  for (const pillar of MEDDPICC_CONFIG.pillars) {
    const score = pillarScores[pillar.id] || 0
    const maxScore = pillarMaxScores[pillar.id] || 1
    const percentage = (score / maxScore) * 100
    
    if (percentage < 50) {
      actions.push(`Complete ${pillar.displayName} assessment - currently ${Math.round(percentage)}% complete`)
    }
  }
  
  return actions
}

function checkStageGateReadiness(responses: MEDDPICCResponse[], pillarScores: Record<string, number>): Record<string, boolean> {
  // Safety check for MEDDPICC_CONFIG
  if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.integrations || !MEDDPICC_CONFIG.integrations.peakPipeline || !MEDDPICC_CONFIG.integrations.peakPipeline.stageGates) {
    console.warn('MEDDPICC_CONFIG not available for stage gate readiness')
    return {}
  }
  
  const readiness: Record<string, boolean> = {}
  
  for (const stageGate of MEDDPICC_CONFIG.integrations.peakPipeline.stageGates) {
    const gateKey = `${stageGate.from}_to_${stageGate.to}`
    let isReady = true
    
    // Check if criteria are met based on responses and scores
    for (const criterion of stageGate.criteria) {
      if (criterion === 'Pain identified') {
        const painScore = pillarScores['identifyPain'] || 0
        if (painScore < 50) isReady = false
      } else if (criterion === 'Champion identified') {
        const championScore = pillarScores['champion'] || 0
        if (championScore < 50) isReady = false
      } else if (criterion === 'Budget confirmed') {
        const budgetScore = pillarScores['economicBuyer'] || 0
        if (budgetScore < 50) isReady = false
      }
      // Add more criteria checks as needed
    }
    
    readiness[gateKey] = isReady
  }
  
  return readiness
}

// Legacy function for backward compatibility
export const calculateMEDDPICCScoreLegacy = (responses: Record<string, number>): number => {
  let totalScore = 0
  let maxPossibleScore = 0

  for (const field of MEDDPICC_FIELDS) {
    const fieldScore = responses[field.id] || 0
    const weightedScore = (fieldScore / 10) * field.weight // Assuming 0-10 scale
    totalScore += weightedScore
    maxPossibleScore += field.weight
  }

  return Math.round((totalScore / maxPossibleScore) * 100)
}

export const getPEAKStageInfo = (stage: string): { name: string; description: string; color: string; nextStage?: string } => {
  const stages = {
    prospecting: {
      name: 'Prospecting',
      description: 'Initial contact and qualification',
      color: 'bg-blue-500',
      nextStage: 'engaging'
    },
    engaging: {
      name: 'Engaging',
      description: 'Active communication and relationship building',
      color: 'bg-yellow-500',
      nextStage: 'advancing'
    },
    advancing: {
      name: 'Advancing',
      description: 'Solution presentation and negotiation',
      color: 'bg-orange-500',
      nextStage: 'key_decision'
    },
    key_decision: {
      name: 'Key Decision',
      description: 'Final decision and closing',
      color: 'bg-green-500'
    }
  }

  return stages[stage as keyof typeof stages] || stages.prospecting
}
