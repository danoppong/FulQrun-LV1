import { AuthService } from '@/lib/auth-unified'
import { isValidTransition, PEAKStageId } from '@/lib/peak'

export interface PeakTransitionInput {
  opportunityId: string
  from: PEAKStageId
  to: PEAKStageId
}

export const peakStageService = {
  async transition({ opportunityId, from, to }: PeakTransitionInput) {
    if (!opportunityId) return { ok: false, status: 400 as const, error: 'Missing opportunityId' }
    if (!isValidTransition(from, to)) return { ok: false, status: 400 as const, error: 'Invalid transition' }

    const supabase = await AuthService.getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, status: 401 as const, error: 'Unauthorized' }

    // Update opportunity's peak_stage; RLS will enforce org access
    type Row = { id: string; peak_stage: PEAKStageId }
    const { data, error } = await supabase
      .from('opportunities' as const)
      .update({ peak_stage: to } as unknown as never)
      .eq('id', opportunityId)
      .select('id, peak_stage')
      .maybeSingle()

    if (error) return { ok: false, status: 500 as const, error: error.message || 'Update failed' }
  if (!data) return { ok: false, status: 404 as const, error: 'Opportunity not found' }
  const row = data as unknown as Row
  return { ok: true as const, opportunityId: row.id, stage: row.peak_stage }
  },
}
