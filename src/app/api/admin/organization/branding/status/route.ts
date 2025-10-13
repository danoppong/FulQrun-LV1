import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'
import { supabaseConfig } from '@/lib/config'

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

export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    if (!supabaseConfig.isConfigured) throw new HttpError(501, 'Storage not configured')

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgIfAdmin(user.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storageClient: any = (supa as unknown as { storage: unknown }).storage as any
    if (!storageClient || !storageClient.from) throw new HttpError(500, 'Storage client unavailable')

    const bucket = 'branding'
    const path = `${orgId}/_policy-check-${Date.now()}.txt`
    const blob = Buffer.from('ok')

    const { error: uploadError } = await storageClient.from(bucket).upload(path, blob, {
      contentType: 'text/plain',
      upsert: true,
      cacheControl: '1',
    })

    if (uploadError) {
      const message = (uploadError as { message?: string }).message || String(uploadError)
      const lower = message.toLowerCase()
      if (lower.includes('not found') || (lower.includes('bucket') && lower.includes('not'))) {
        throw new HttpError(424, 'Storage bucket "branding" not found. Create a public bucket named "branding" in Supabase Storage.')
      }
      if (
        lower.includes('row level security') ||
        lower.includes('row-level security') ||
        lower.includes('violates row-level security') ||
        lower.includes('rls') ||
        lower.includes('permission denied') ||
        lower.includes('not authorized')
      ) {
        throw new HttpError(403, 'Storage write blocked by RLS. Policies must allow authenticated admins to write under their org prefix.')
      }
      throw new HttpError(500, `Policy check failed: ${message}`)
    }

    // Attempt cleanup (best-effort)
    // Some policies may not allow delete; ignore failure
    try {
      await storageClient.from(bucket).remove([path])
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, write: true })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (!(error instanceof HttpError)) {
      console.error('[branding/status] unexpected error:', error)
    }
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status })
  }
}
