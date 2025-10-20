import { AuthService } from '@/lib/auth-unified'

export interface DashboardRoleTemplate {
  id: string
  organization_id: string
  role: string
  name: string
  layout_json: unknown
  published_at: string
  updated_at: string
}

export const DashboardTemplatesService = {
  async list(role?: string): Promise<DashboardRoleTemplate[]> {
    const supabase = await AuthService.getServerClient()
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return []
    const orgId = user.profile.organization_id
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => { eq: (c: string, v: string) => { eq: (c2: string, v2: string) => { order: (c3: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: unknown }> } } }
      }
    })
      .from('dashboard_role_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('role', role || user.profile.role)
      .order('published_at', { ascending: false })
    if (error) return []
    return (data as DashboardRoleTemplate[]) || []
  },

  async publish(role: string, name: string, layout: unknown): Promise<DashboardRoleTemplate | null> {
    const supabase = await AuthService.getServerClient()
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return null
    const payload = {
      organization_id: user.profile.organization_id,
      role,
      name,
      layout_json: layout,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => { insert: (v: unknown) => { select: (c: string) => Promise<{ data: unknown; error: unknown }> } }
    })
      .from('dashboard_role_templates')
      .insert(payload)
      .select('*')
    if (error) return null
    const rows = (data as DashboardRoleTemplate[]) || []
    return rows[0] ?? null
  }
}
