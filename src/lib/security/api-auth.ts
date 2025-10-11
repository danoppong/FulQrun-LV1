import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-unified'

export async function requireApiAuth() {
  const supabase = await AuthService.getServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { ok: false as const, user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, user }
}

export async function getUserProfileOrg() {
  const supabase = await AuthService.getServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  return { user, profile: data as { organization_id: string | null; role: string | null } | null }
}
