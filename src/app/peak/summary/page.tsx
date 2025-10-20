import { AuthService } from '@/lib/auth-unified'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PEAK_STAGE_ORDER, type PEAKStageId } from '@/lib/peak'

export const runtime = 'nodejs'

type StageCountRow = { peak_stage: PEAKStageId | null; count: number }

async function getStageCounts() {
  const supabase = await AuthService.getServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Resolve organization id of the user
  const { data: profile } = await supabase
    .from('users' as const)
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const orgId = (profile as { organization_id?: string } | null)?.organization_id
  if (!orgId) {
    return [] as StageCountRow[]
  }

  // Fetch and aggregate locally (typed), keeping RLS in place
  const { data, error } = await supabase
    .from('opportunities' as const)
    .select('peak_stage')
    .eq('organization_id', orgId)

  if (error || !data) {
    return [] as StageCountRow[]
  }

  const map = new Map<string | null, number>()
  for (const row of data as Array<{ peak_stage: string | null }>) {
    const key = row.peak_stage ?? null
    map.set(key, (map.get(key) || 0) + 1)
  }
  const out: StageCountRow[] = []
  for (const [k, v] of map.entries()) {
    out.push({ peak_stage: (k as PEAKStageId | null), count: v })
  }
  return out
}

export default async function PeakSummaryPage() {
  const rows = await getStageCounts()
  const countsByStage = new Map<PEAKStageId, number>()
  for (const s of PEAK_STAGE_ORDER) countsByStage.set(s.id, 0)
  for (const r of rows) {
    if (r.peak_stage && countsByStage.has(r.peak_stage)) {
      countsByStage.set(r.peak_stage, (countsByStage.get(r.peak_stage) || 0) + r.count)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">PEAK Pipeline Summary</h1>
              <p className="text-sm text-gray-600">Stage distribution for your organization</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/opportunities" className="text-blue-600 hover:text-blue-800">
                View Opportunities →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PEAK_STAGE_ORDER.map((s) => {
            const count = countsByStage.get(s.id) || 0
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{s.description}</p>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{count}</div>
                </div>
                <div className="mt-4">
                  <Link
                    href={{ pathname: '/opportunities', query: { stage: s.id } }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View {s.name} deals
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Work your pipeline</h2>
            <Link href="/peak" className="text-blue-600 hover:text-blue-800">Open PEAK Workflow →</Link>
          </div>
          <p className="text-sm text-gray-600 mt-2">Use the workflow to manage documents and advance deals stage-by-stage.</p>
        </div>
      </div>
    </div>
  )
}
