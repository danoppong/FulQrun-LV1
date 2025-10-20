import { getNextStage, getRecommendedActions, getStageInfo } from '@/lib/peak'

describe('lib/peak helpers', () => {
  test('getNextStage returns correct progression', () => {
    expect(getNextStage('prospecting')).toBe('engaging')
    expect(getNextStage('engaging')).toBe('advancing')
    expect(getNextStage('advancing')).toBe('key_decision')
    expect(getNextStage('key_decision')).toBeUndefined()
  })

  test('getRecommendedActions returns non-empty lists', () => {
    expect(getRecommendedActions('prospecting').length).toBeGreaterThan(0)
    expect(getRecommendedActions('engaging').length).toBeGreaterThan(0)
    expect(getRecommendedActions('advancing').length).toBeGreaterThan(0)
    expect(getRecommendedActions('key_decision').length).toBeGreaterThan(0)
  })

  test('getStageInfo mirrors expected names and descriptions', () => {
    expect(getStageInfo('prospecting').name).toBe('Prospecting')
    expect(getStageInfo('prospecting').description).toBe('Initial contact and qualification')
    expect(getStageInfo('engaging').name).toBe('Engaging')
    expect(getStageInfo('engaging').description).toBe('Active communication and relationship building')
  })
})
