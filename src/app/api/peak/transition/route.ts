import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/validation'
import { peakStageService } from '@/lib/services/peak-stage-service'
import type { PeakTransitionInput } from '@/lib/services/peak-stage-service'

export const runtime = 'nodejs'

const stageEnum = z.enum(['prospecting', 'engaging', 'advancing', 'key_decision'])
const schema = z.object({
  opportunityId: z.string().min(1),
  from: stageEnum,
  to: stageEnum,
})

function ip(req: NextRequest) {
  const xf = req.headers.get('x-forwarded-for') ?? ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

function json(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  return new Response(JSON.stringify(body), { ...init, headers })
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(ip(req))) {
    return json({ error: 'Rate limit' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return json({ error: 'Invalid payload' }, { status: 400 })
  }
  const input = parsed.data as PeakTransitionInput
  const res = await peakStageService.transition(input)
  if (!res.ok) {
    return json({ error: res.error }, { status: res.status })
  }
  return json({ success: true, opportunityId: res.opportunityId, stage: res.stage })
}
