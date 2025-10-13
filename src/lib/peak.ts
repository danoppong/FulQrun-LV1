// Centralized PEAK Process domain definitions and helpers
// Keep stage ids, names, and descriptions in sync with tests and MEDDPICC integration

export type PEAKStageId = 'prospecting' | 'engaging' | 'advancing' | 'key_decision'

export interface PEAKStageMeta {
  id: PEAKStageId
  name: string
  description: string
}

// Ordered list of PEAK stages for progression logic
export const PEAK_STAGES: readonly PEAKStageMeta[] = [
  {
    id: 'prospecting',
    name: 'Prospecting',
    description: 'Initial contact and qualification',
  },
  {
    id: 'engaging',
    name: 'Engaging',
    description: 'Active communication and relationship building',
  },
  {
    id: 'advancing',
    name: 'Advancing',
    description: 'Solution presentation and negotiation',
  },
  {
    id: 'key_decision',
    name: 'Key Decision',
    description: 'Final decision and closing',
  },
]

// Convenience ordered view of stages (current simple linear order)
export const PEAK_STAGE_ORDER = PEAK_STAGES

const STAGE_INDEX: Record<PEAKStageId, number> = PEAK_STAGES.reduce((acc, s, i) => {
  acc[s.id] = i
  return acc
}, {} as Record<PEAKStageId, number>)

export const getStageInfo = (
  stage: string
): { name: string; description: string; nextStage?: PEAKStageId } => {
  const meta = PEAK_STAGES.find((s) => s.id === (stage as PEAKStageId))
  if (!meta) {
    return { name: 'Unknown', description: 'Unknown stage' }
  }
  const idx = STAGE_INDEX[meta.id]
  const next = idx < PEAK_STAGES.length - 1 ? (PEAK_STAGES[idx + 1].id as PEAKStageId) : undefined
  return { name: meta.name, description: meta.description, nextStage: next }
}

export const getNextStage = (stage: PEAKStageId): PEAKStageId | undefined => {
  const idx = STAGE_INDEX[stage]
  return idx < PEAK_STAGES.length - 1 ? PEAK_STAGES[idx + 1].id : undefined
}

// Simple transition validator: allow staying on same stage or moving forward by one step
export const isValidTransition = (from: PEAKStageId, to: PEAKStageId): boolean => {
  if (from === to) return true
  const fromIdx = STAGE_INDEX[from]
  const toIdx = STAGE_INDEX[to]
  return toIdx === fromIdx + 1
}

const RECOMMENDED_ACTIONS: Record<PEAKStageId, string[]> = {
  prospecting: [
    'Research the prospect thoroughly',
    'Identify key decision makers',
    'Understand their pain points',
    'Qualify budget and timeline',
  ],
  engaging: [
    'Schedule discovery calls',
    'Share relevant case studies',
    'Build relationships with stakeholders',
    'Understand their evaluation process',
  ],
  advancing: [
    'Present your solution',
    'Address objections',
    'Negotiate terms and pricing',
    'Get buy-in from economic buyer',
  ],
  key_decision: [
    'Finalize contract terms',
    'Coordinate with legal team',
    'Prepare for implementation',
    'Close the deal',
  ],
}

export const getRecommendedActions = (stage: PEAKStageId): string[] => {
  return RECOMMENDED_ACTIONS[stage] ?? []
}

// Convenience data for UI lists (label/value)
export const PEAK_STAGE_OPTIONS = PEAK_STAGES.map((s) => ({ value: s.id, label: s.name }))
