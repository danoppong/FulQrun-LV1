export interface MEDDPICCField {
  id: string
  name: string
  description: string
  weight: number
  questions: string[]
}

export const MEDDPICC_FIELDS: MEDDPICCField[] = [
  {
    id: 'metrics',
    name: 'Metrics',
    description: 'Quantify the business impact and ROI',
    weight: 20,
    questions: [
      'What is the current cost of the problem?',
      'What is the expected ROI from solving this problem?',
      'How will success be measured?',
      'What are the key performance indicators?'
    ]
  },
  {
    id: 'economic_buyer',
    name: 'Economic Buyer',
    description: 'Identify the person who can approve the budget',
    weight: 25,
    questions: [
      'Who has the authority to approve this purchase?',
      'What is their role and influence level?',
      'Have we met with the economic buyer?',
      'What is their budget authority?'
    ]
  },
  {
    id: 'decision_criteria',
    name: 'Decision Criteria',
    description: 'Understand how they will evaluate solutions',
    weight: 20,
    questions: [
      'What are their key decision criteria?',
      'How important is each criterion?',
      'What are their must-haves vs nice-to-haves?',
      'How do they prioritize features?'
    ]
  },
  {
    id: 'decision_process',
    name: 'Decision Process',
    description: 'Map the approval workflow and timeline',
    weight: 15,
    questions: [
      'What is their decision-making process?',
      'Who else needs to be involved?',
      'What is the timeline for decision?',
      'What are the approval steps?'
    ]
  },
  {
    id: 'paper_process',
    name: 'Paper Process',
    description: 'Document requirements and procurement process',
    weight: 10,
    questions: [
      'What documentation is required?',
      'What is their procurement process?',
      'Are there any compliance requirements?',
      'What contracts or agreements are needed?'
    ]
  },
  {
    id: 'identify_pain',
    name: 'Identify Pain',
    description: 'Understand their pain points and challenges',
    weight: 20,
    questions: [
      'What is their biggest challenge?',
      'What happens if they don\'t solve this?',
      'How urgent is this problem?',
      'What have they tried before?'
    ]
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Find internal advocate who will support you',
    weight: 15,
    questions: [
      'Who is our internal champion?',
      'What is their influence level?',
      'How committed are they to our solution?',
      'Can they help navigate internal politics?'
    ]
  },
  {
    id: 'competition',
    name: 'Competition',
    description: 'Assess competitive landscape and positioning',
    weight: 10,
    questions: [
      'Who else are they considering?',
      'What are our competitive advantages?',
      'How do we differentiate ourselves?',
      'What is our win probability?'
    ]
  }
]

export const calculateMEDDPICCScore = (responses: Record<string, number>): number => {
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

export const getMEDDPICCLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 80) {
    return {
      level: 'Excellent',
      color: 'bg-green-500',
      description: 'High probability of closing - all key areas covered'
    }
  } else if (score >= 60) {
    return {
      level: 'Good',
      color: 'bg-blue-500',
      description: 'Good qualification - some areas need attention'
    }
  } else if (score >= 40) {
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
