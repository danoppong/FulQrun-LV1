import { describe, it, expect, jest, beforeAll } from '@jest/globals'

// Helper to make a minimal NextRequest-like object
function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  // Minimal fetch-like Request polyfill for the route
  const req = {
    headers: new Map(Object.entries(headers)),
    json: async () => body,
    get url() {
      return 'http://localhost/api/peak/transition'
    },
    // NextRequest surface we actually read in the handler
    cookies: { get: () => undefined },
    nextUrl: new URL('http://localhost/api/peak/transition') as unknown,
    page: undefined,
    ua: undefined,
  }
  return req as unknown as import('next/server').NextRequest
}

// Mock the service to isolate API validation and error mapping
jest.mock('@/lib/services/peak-stage-service', () => {
  return {
    peakStageService: {
      transition: jest.fn(async (input: { opportunityId: string; from: string; to: string }) => {
        if (input.opportunityId === 'bad') return { ok: false as const, status: 400, error: 'Invalid transition' }
        if (input.opportunityId === 'unauth') return { ok: false as const, status: 401, error: 'Unauthorized' }
        return { ok: true as const, opportunityId: input.opportunityId, stage: input.to }
      })
    }
  }
})

// Mock rate limit always passes for these tests
jest.mock('@/lib/validation', () => ({
  checkRateLimit: () => true,
}))

// Import the route AFTER mocks are set up so the mocks are applied
let peakTransitionPOST: (req: import('next/server').NextRequest) => Promise<Response>
beforeAll(async () => {
  const mod = await import('@/app/api/peak/transition/route')
  peakTransitionPOST = mod.POST as typeof peakTransitionPOST
})

describe('API /api/peak/transition', () => {
  it('rejects invalid payload', async () => {
    const res = await peakTransitionPOST(makeRequest({}))
    const json = await (res as Response).json()
    expect((res as Response).status).toBe(400)
    expect(json.error).toBe('Invalid payload')
  })

  it('maps service error codes to HTTP', async () => {
    const res400 = await peakTransitionPOST(makeRequest({ opportunityId: 'bad', from: 'prospecting', to: 'advancing' }))
    expect((res400 as Response).status).toBe(400)

    const res401 = await peakTransitionPOST(makeRequest({ opportunityId: 'unauth', from: 'prospecting', to: 'engaging' }))
    expect((res401 as Response).status).toBe(401)
  })

  it('returns success with opportunityId and stage', async () => {
    const res = await peakTransitionPOST(makeRequest({ opportunityId: 'opp1', from: 'prospecting', to: 'engaging' }))
    const json = await (res as Response).json()
    expect((res as Response).status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.opportunityId).toBe('opp1')
    expect(json.stage).toBe('engaging')
  })
})
