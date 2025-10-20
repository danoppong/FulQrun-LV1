import { getSupabaseBrowserClient } from '@/lib/supabase-singleton'
import { supabaseConfig } from '@/lib/config'

type Role = 'salesman' | 'manager' | 'admin' | 'super_admin'

type UserProfileRow = { organization_id: string | null; role: string | null }
type LegacyUserRow = { organization_id: string | null; role: string | null }

type MaybeSingleResult<T> = Promise<{ data: T | null; error: unknown }>
type FromSelectEqMaybeSingle<T> = {
  select: (columns: string) => {
    eq: (column: string, value: string) => { maybeSingle: () => MaybeSingleResult<T> }
  }
}
type FromUpsert<T> = { upsert: (values: T, options?: { onConflict?: string }) => Promise<{ error: unknown | null }> }

function supabaseFromForSelect<T>(supabase: unknown) {
  return (supabase as { from: (table: string) => FromSelectEqMaybeSingle<T> }).from
}

function supabaseFromForUpsert<T>(supabase: unknown) {
  return (supabase as { from: (table: string) => FromUpsert<T> }).from
}

export interface ProfileContext {
  userId: string
  email: string | null
  role: Role | null
  organizationId: string | null
  source: 'user_profiles' | 'users' | 'claims' | 'unknown'
}

export interface ReconcileResult {
  ok: boolean
  createdUserProfile?: boolean
  createdLegacyUser?: boolean
  context: ProfileContext
  message?: string
}

export const UserProfileManager = {
  // Resolve org/role from user_profiles, fallback to legacy users, then JWT claims
  async resolveContext(userId: string, email: string | null) : Promise<ProfileContext> {
    const supabase = getSupabaseBrowserClient()

    // 1) Try user_profiles
    const upResp = await supabaseFromForSelect<UserProfileRow>(supabase)('user_profiles')
      .select('organization_id, role')
      .eq('id', userId)
      .maybeSingle()
    const up = (upResp?.data ?? null) as UserProfileRow | null

    if (up && up.organization_id) {
      return {
        userId,
        email,
        role: (up.role as Role) ?? null,
        organizationId: up.organization_id,
        source: 'user_profiles',
      }
    }

    // 2) Try legacy users table (public.users)
    const legacyResp = await supabaseFromForSelect<LegacyUserRow>(supabase)('users')
      .select('organization_id, role')
      .eq('id', userId)
      .maybeSingle()
    const legacy = (legacyResp?.data ?? null) as LegacyUserRow | null

    if (legacy && legacy.organization_id) {
      // map legacy roles to current
      const mappedRole: Role | null = legacy.role === 'rep' ? 'salesman' : (legacy.role as Role)
      return {
        userId,
        email,
        role: mappedRole,
        organizationId: legacy.organization_id,
        source: 'users',
      }
    }

    // 3) Try JWT claims (user_metadata)
    const { data: userRes } = await supabase.auth.getUser()
    type Claims = { organization_id?: string; role?: string }
    const claims = (userRes.user?.user_metadata as unknown) as Claims | undefined
    const orgFromClaims = claims?.organization_id ?? null
    const roleFromClaimsRaw = claims?.role
    if (orgFromClaims) {
      let mappedRole: Role | null = null
      if (roleFromClaimsRaw === 'rep') mappedRole = 'salesman'
      else if (roleFromClaimsRaw === 'salesman' || roleFromClaimsRaw === 'manager' || roleFromClaimsRaw === 'admin' || roleFromClaimsRaw === 'super_admin') mappedRole = roleFromClaimsRaw
      return { userId, email, role: mappedRole, organizationId: orgFromClaims, source: 'claims' }
    }

    return { userId, email, role: null, organizationId: null, source: 'unknown' }
  },

  // Upsert user_profiles for the current user
  async ensureUserProfile(params: { userId: string; email: string | null; organizationId: string; role: Role | null; managerId?: string | null }): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const role = params.role ?? 'salesman'
    const { error } = await supabaseFromForUpsert<{ id: string; email: string | null; role: string; organization_id: string; manager_id: string | null }>(supabase)('user_profiles')
      .upsert({
        id: params.userId,
        email: params.email,
        role,
        organization_id: params.organizationId,
        manager_id: params.managerId ?? null,
      }, { onConflict: 'id' })
    return !error
  },

  // Upsert legacy users row (public.users) to satisfy FKs
  async ensureLegacyUser(params: { userId: string; email: string | null; organizationId: string; role: Role | null }): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const legacyRole = params.role === 'salesman' ? 'rep' : (params.role ?? 'rep')
    const { error } = await supabaseFromForUpsert<{ id: string; email: string | null; role: string; organization_id: string; updated_at: string }>(supabase)('users')
      .upsert({
        id: params.userId,
        email: params.email,
        role: legacyRole,
        organization_id: params.organizationId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    return !error
  },

  // Reconcile current user end-to-end (client context)
  async reconcileCurrentUser(): Promise<ReconcileResult> {
    if (!supabaseConfig.isConfigured) {
      return { ok: false, context: { userId: '', email: null, role: null, organizationId: null, source: 'unknown' }, message: 'Supabase not configured' }
    }

    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, context: { userId: '', email: null, role: null, organizationId: null, source: 'unknown' }, message: 'No authenticated user' }
    }

    const ctx = await this.resolveContext(user.id, user.email)
    if (!ctx.organizationId) {
      return { ok: false, context: ctx, message: 'Unable to resolve organization. Ask an admin to run the SQL fix script.' }
    }

    const createdProfile = await this.ensureUserProfile({ userId: user.id, email: user.email, organizationId: ctx.organizationId, role: ctx.role })
    const createdLegacy = await this.ensureLegacyUser({ userId: user.id, email: user.email, organizationId: ctx.organizationId, role: ctx.role })

    return { ok: createdProfile && createdLegacy, createdUserProfile: createdProfile, createdLegacyUser: createdLegacy, context: ctx }
  },
}
