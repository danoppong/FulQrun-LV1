import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'
import { supabaseConfig } from '@/lib/config'

export const runtime = 'nodejs'

type UploadType = 'logo' | 'favicon' | 'emailHeaderLogo'

function getIp(request: NextRequest) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }

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

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    if (!supabaseConfig.isConfigured) throw new HttpError(501, 'Storage not configured')

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgIfAdmin(user.id)

    let type: UploadType | null = null
  let input: Buffer | null = null

    const contentTypeHeader = request.headers.get('content-type') || ''
    const isJson = contentTypeHeader.includes('application/json')

  if (isJson) {
      // Support JSON body: { url: string, type: UploadType }
      const body = (await request.json()) as { url?: string; type?: UploadType }
      type = body.type ?? null
      const url = body.url?.trim()
      if (!type || !['logo', 'favicon', 'emailHeaderLogo'].includes(type)) throw new HttpError(400, 'Invalid type')
      if (!url) throw new HttpError(400, 'Missing url')
      const resp = await fetch(url)
      if (!resp.ok) throw new HttpError(400, `Failed to fetch URL (${resp.status})`)
      const buf = Buffer.from(await resp.arrayBuffer())
      input = buf
    } else {
      // Default: multipart/form-data with file and optional url
      const form = await request.formData()
      const file = form.get('file') as File | null
      type = form.get('type') as UploadType | null
      const url = (form.get('url') as string | null)?.trim()
      if (!type || !['logo', 'favicon', 'emailHeaderLogo'].includes(type)) throw new HttpError(400, 'Invalid type')
      if (file) {
        const arrayBuf = await file.arrayBuffer()
        input = Buffer.from(arrayBuf)
      } else if (url) {
        const resp = await fetch(url)
        if (!resp.ok) throw new HttpError(400, `Failed to fetch URL (${resp.status})`)
        const buf = Buffer.from(await resp.arrayBuffer())
        input = buf
      } else {
        throw new HttpError(400, 'Missing file or url')
      }
    }

    // Process image using sharp according to type
    let output: Buffer
    const contentType = 'image/png'
    if (type === 'logo') {
      output = await sharp(input)
        .resize({ width: 256, withoutEnlargement: true, fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer()
    } else if (type === 'emailHeaderLogo') {
      output = await sharp(input)
        .resize({ width: 600, withoutEnlargement: true, fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer()
    } else {
      // favicon: 32x32 on transparent background
      output = await sharp(input)
        .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    }

    // Upload to Supabase Storage
    const bucket = 'branding'
    const timestamp = Date.now()
    const filename = type === 'favicon' ? `favicon-32-${timestamp}.png` : `${type}-${timestamp}.png`
    const path = `${orgId}/${filename}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storageClient: any = (supa as unknown as { storage: unknown }).storage as any
    if (!storageClient || !storageClient.from) throw new HttpError(500, 'Storage client unavailable')

    const { error: uploadError } = await storageClient.from(bucket).upload(path, output, {
      contentType,
      upsert: true,
      cacheControl: '31536000',
    })
    if (uploadError) {
      const message = (uploadError as { message?: string }).message || String(uploadError)
      // Log server-side for easier debugging in dev
      console.error('[branding/upload] storage upload error:', uploadError)
      const lower = message.toLowerCase()
      if (lower.includes('not found') || (lower.includes('bucket') && lower.includes('not'))) {
        throw new HttpError(424, 'Storage bucket "branding" not found. Create a public bucket named "branding" in Supabase Storage.')
      }
      // Map common RLS messages (with or without hyphen) to 403
      if (
        lower.includes('row level security') ||
        lower.includes('row-level security') ||
        lower.includes('violates row-level security') ||
        lower.includes('rls') ||
        lower.includes('permission denied') ||
        lower.includes('not authorized')
      ) {
        throw new HttpError(403, 'Storage write blocked by RLS. Ensure branding bucket policies allow authenticated users to write under their org prefix (e.g., \'<orgId>/...\').')
      }
      throw new HttpError(500, `Upload failed: ${message}`)
    }

    const { data: publicUrlData } = storageClient.from(bucket).getPublicUrl(path)
    const url: string | undefined = publicUrlData?.publicUrl
    if (!url) throw new HttpError(500, 'Failed to obtain public URL')

    // Upsert setting for convenience and homepage usage
    const settingKey = type === 'favicon' ? 'branding.faviconUrl' : (type === 'logo' ? 'branding.logoUrl' : 'branding.emailHeaderLogo')
    // organization_settings might not be in generated types yet; use untyped call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supa as any)
      .from('organization_settings' as const)
      .upsert({
        organization_id: orgId,
        setting_key: settingKey,
        setting_value: url,
        is_public: type !== 'emailHeaderLogo',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,setting_key' })

    if (upsertError) {
      // Don't fail the upload if settings upsert fails; return URL with warning
      return NextResponse.json({ success: true, url, warning: 'Uploaded but failed to persist setting', details: String((upsertError as { message?: string }).message || upsertError) })
    }

    return NextResponse.json({ success: true, url })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    // Log unexpected errors
    if (!(error instanceof HttpError)) {
      console.error('[branding/upload] unexpected error:', error)
    }
    return NextResponse.json({ error: (error as Error).message || 'Upload failed' }, { status })
  }
}
