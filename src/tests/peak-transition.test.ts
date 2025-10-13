import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { peakStageService } from '@/lib/services/peak-stage-service'
import * as authUnified from '@/lib/auth-unified'

// Mock AuthService.getServerClient() shape minimally
function makeMockSupabase({ withUser = true, updateOk = true }: { withUser?: boolean; updateOk?: boolean }) {
  const updateChain = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(
      updateOk
        ? { data: { id: 'opp1', peak_stage: 'engaging' }, error: null }
        : { data: null, error: { message: 'Update failed' } }
    ),
  }
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue(
        withUser ? { data: { user: { id: 'user1' } } } : { data: { user: null } }
      ),
    },
    from: jest.fn().mockReturnValue(updateChain),
  }
}

jest.mock('@/lib/auth-unified')

describe('PEAK transition service', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects missing opportunityId', async () => {
    // @ts-expect-error testing invalid input
    const res = await peakStageService.transition({ opportunityId: '', from: 'prospecting', to: 'engaging' })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(400)
  })

  it('rejects invalid transitions', async () => {
  const supa = makeMockSupabase({})
  jest.spyOn(authUnified.AuthService, 'getServerClient').mockResolvedValue(supa as unknown as ReturnType<typeof makeMockSupabase>)
    const res = await peakStageService.transition({ opportunityId: 'opp1', from: 'prospecting', to: 'advancing' })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(400)
  })

  it('rejects when unauthorized', async () => {
  const supa = makeMockSupabase({ withUser: false })
  jest.spyOn(authUnified.AuthService, 'getServerClient').mockResolvedValue(supa as unknown as ReturnType<typeof makeMockSupabase>)
    const res = await peakStageService.transition({ opportunityId: 'opp1', from: 'prospecting', to: 'engaging' })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
  })

  it('updates stage on valid transition', async () => {
  const supa = makeMockSupabase({ withUser: true, updateOk: true })
  jest.spyOn(authUnified.AuthService, 'getServerClient').mockResolvedValue(supa as unknown as ReturnType<typeof makeMockSupabase>)
    const res = await peakStageService.transition({ opportunityId: 'opp1', from: 'prospecting', to: 'engaging' })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.stage).toBe('engaging')
      expect(res.opportunityId).toBe('opp1')
    }
  })

  it('bubbles up update failure', async () => {
  const supa = makeMockSupabase({ withUser: true, updateOk: false })
  jest.spyOn(authUnified.AuthService, 'getServerClient').mockResolvedValue(supa as unknown as ReturnType<typeof makeMockSupabase>)
    const res = await peakStageService.transition({ opportunityId: 'opp1', from: 'prospecting', to: 'engaging' })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(500)
  })
})
