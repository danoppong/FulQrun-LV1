import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/config'

export async function GET() {
  try {
    const url = supabaseConfig.url
    if (!url) return NextResponse.json({ ok: false, url: '/icon.svg' })

    // Prefer service role for public homepage access under RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const key = serviceKey ?? supabaseConfig.anonKey
    if (!key) return NextResponse.json({ ok: false, url: '/icon.svg' })

    const supa = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

    // Try public settings first
    const { data, error } = await supa
      .from('organization_settings')
      .select('setting_key, setting_value')
      .eq('is_public', true)
      .in('setting_key', ['branding', 'branding.logoUrl'])
      .order('updated_at', { ascending: false })
      .limit(1)

    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as { setting_key: string; setting_value: unknown }
      let urlOut: string | null = null
      if (row.setting_key === 'branding') {
        const v = row.setting_value as { logoUrl?: string } | null
        urlOut = v?.logoUrl || null
      } else if (row.setting_key === 'branding.logoUrl') {
        const sv = row.setting_value as unknown
        if (typeof sv === 'string') urlOut = sv
        else if (sv && typeof sv === 'object' && 'value' in (sv as Record<string, unknown>)) {
          const val = (sv as Record<string, unknown>).value
          if (typeof val === 'string') urlOut = val
        }
      }
      if (urlOut) return NextResponse.json({ ok: true, url: urlOut })
    }

    // Fallback
    return NextResponse.json({ ok: true, url: '/icon.svg' })
  } catch {
    return NextResponse.json({ ok: false, url: '/icon.svg' })
  }
}
