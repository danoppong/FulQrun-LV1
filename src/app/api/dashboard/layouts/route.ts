import { NextRequest, NextResponse } from 'next/server'
import { DashboardLayoutsService } from '@/lib/services/dashboard-layouts'
import { requireApiAuth } from '@/lib/security/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    if (!auth.ok) return auth.response
    const found = await DashboardLayoutsService.getMyLayout()
    if (!found) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }
    return NextResponse.json({
      exists: true,
      id: found.id,
      name: found.name,
      layout: found.layout_json,
      updatedAt: found.updated_at
    })
  } catch (_e) {
    return NextResponse.json({ error: 'Failed to load layout' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (!auth.ok) return auth.response
    const body = await req.json()
    const { name, layout } = body || {}
    if (!Array.isArray(layout)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const saved = await DashboardLayoutsService.upsertMyLayout(name || 'My Dashboard', layout)
    return NextResponse.json({ id: saved.id, name: saved.name, updatedAt: saved.updated_at })
  } catch (_e) {
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 })
  }
}
