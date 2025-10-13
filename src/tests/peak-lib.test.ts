import { describe, it, expect } from '@jest/globals'
import {
  PEAK_STAGES,
  PEAK_STAGE_ORDER,
  type PEAKStageId,
  getNextStage,
  getStageInfo,
  isValidTransition,
  getRecommendedActions,
} from '@/lib/peak'

const ORDER: PEAKStageId[] = ['prospecting', 'engaging', 'advancing', 'key_decision']

describe('PEAK lib: stages and helpers', () => {
  it('keeps stage order consistent', () => {
    const ids = PEAK_STAGES.map(s => s.id)
    expect(ids).toEqual(ORDER)
    expect(PEAK_STAGE_ORDER.map(s => s.id)).toEqual(ORDER)
  })

  it('getNextStage returns the next stage or undefined at the end', () => {
    expect(getNextStage('prospecting')).toBe('engaging')
    expect(getNextStage('engaging')).toBe('advancing')
    expect(getNextStage('advancing')).toBe('key_decision')
    expect(getNextStage('key_decision')).toBeUndefined()
  })

  it('getStageInfo returns name, description and nextStage when available', () => {
    const info = getStageInfo('prospecting')
    expect(info.name).toBe('Prospecting')
    expect(info.description).toBeDefined()
    expect(info.nextStage).toBe('engaging')

    const end = getStageInfo('key_decision')
    expect(end.name).toBe('Key Decision')
    expect(end.nextStage).toBeUndefined()

    const unknown = getStageInfo('nope')
    expect(unknown.name).toBe('Unknown')
  })

  it('isValidTransition allows staying on same stage or moving forward by one step only', () => {
    const pairs: Array<[PEAKStageId, PEAKStageId, boolean]> = [
      ['prospecting', 'prospecting', true],
      ['prospecting', 'engaging', true],
      ['prospecting', 'advancing', false],
      ['engaging', 'advancing', true],
      ['engaging', 'key_decision', false],
      ['advancing', 'key_decision', true],
      ['key_decision', 'key_decision', true],
    ]
    for (const [from, to, ok] of pairs) {
      expect(isValidTransition(from, to)).toBe(ok)
    }
  })

  it('getRecommendedActions returns a non-empty list per stage', () => {
    for (const s of ORDER) {
      const actions = getRecommendedActions(s)
      expect(Array.isArray(actions)).toBe(true)
      expect(actions.length).toBeGreaterThan(0)
    }
  })
})
