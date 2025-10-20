import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'

export const runtime = 'nodejs'

class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }

function getIp(request: NextRequest) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

async function getOrgIfAdmin(userId: string) {
  const supa = await AuthService.getServerClient()
  const { data, error } = await supa
    .from('users' as const)
    .select('organization_id, role')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) throw new HttpError(404, 'User not found')
  const role = (data as { role?: string }).role || ''
  if (!['admin', 'super_admin'].includes(role)) throw new HttpError(403, 'Insufficient permissions')
  return (data as { organization_id: string }).organization_id
}

const settingsSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  emailHeaderLogo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional(),
  secondaryColor: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional(),
  emailFooterText: z.string().max(2000).optional(),
  customCSS: z.string().max(20000).optional(),
})

const KEYS: Record<string, string> = {
  logoUrl: 'branding.logoUrl',
  faviconUrl: 'branding.faviconUrl',
  emailHeaderLogo: 'branding.emailHeaderLogo',
  primaryColor: 'branding.primaryColor',
  secondaryColor: 'branding.secondaryColor',
  emailFooterText: 'branding.emailFooterText',
  customCSS: 'branding.customCSS',
}

export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgIfAdmin(user.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supa as any)
      .from('organization_settings' as const)
      .select('settings')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (error) throw new HttpError(500, String(error.message || error))

    const settings = (data?.settings as Record<string, unknown> | undefined) || {}
    const branding = (settings.branding as Record<string, unknown> | undefined) || {}

    const out: Record<string, string> = {}
    for (const key of Object.keys(KEYS)) {
      const v = branding[key]
      if (typeof v === 'string') out[key] = v
    }
    return NextResponse.json({ success: true, settings: out })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (!(error instanceof HttpError)) console.error('[branding/settings GET] unexpected', error)
    return NextResponse.json({ error: (error as Error).message || 'Failed to load settings' }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgIfAdmin(user.id)
    const body = await request.json().catch(() => ({}))
    const parsed = settingsSchema.parse(body)

    // Load current settings JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cur, error: selErr } = await (supa as any)
      .from('organization_settings' as const)
      .select('settings')
      .eq('organization_id', orgId)
      .maybeSingle()
    if (selErr) throw new HttpError(500, String(selErr.message || selErr))

    const currentSettings = (cur?.settings as Record<string, unknown> | undefined) || {}
    const currentBranding = (currentSettings.branding as Record<string, unknown> | undefined) || {}

    const mergedBranding = { ...currentBranding, ...parsed }
    const newSettings = { ...currentSettings, branding: mergedBranding }

    if (!cur) {
      // Insert a new row for this org
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insErr } = await (supa as any)
        .from('organization_settings' as const)
        .insert({ organization_id: orgId, settings: newSettings })
      if (insErr) throw new HttpError(500, String(insErr.message || insErr))
      return NextResponse.json({ success: true })
    }

    // Update existing row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (supa as any)
      .from('organization_settings' as const)
      .update({ settings: newSettings })
      .eq('organization_id', orgId)
    if (updErr) throw new HttpError(500, String(updErr.message || updErr))

    return NextResponse.json({ success: true })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (!(error instanceof HttpError)) console.error('[branding/settings POST] unexpected', error)
    return NextResponse.json({ error: (error as Error).message || 'Failed to save settings' }, { status })
  }
}
