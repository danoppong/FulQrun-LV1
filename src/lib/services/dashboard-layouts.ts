import { AuthService } from '@/lib/auth-unified'

export interface SavedLayout {
  id: string
  name: string
  layout_json: unknown
  updated_at: string
}

export const DashboardLayoutsService = {
  async getMyLayout() {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) return null
    const supabase = await AuthService.getServerClient()
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) return null
    return data as SavedLayout
  },

  async upsertMyLayout(name: string, layout: unknown) {
    const user = await AuthService.getCurrentUserServer()
    if (!user?.profile) throw new Error('Not authenticated')
    const supabase = await AuthService.getServerClient()
    const payload = {
      user_id: user.id,
      organization_id: user.profile.organization_id,
      name,
      layout_json: layout,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await (supabase as unknown as {
      from: (table: string) => {
        upsert: (values: unknown) => { select: (cols: string) => { single: () => Promise<{ data: unknown; error: unknown }> } }
        select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: unknown; error: unknown }> } }
      }
    })
      .from('user_dashboard_layouts')
      .upsert(payload)
      .select('*')
      .single()
    if (error) throw error as Error
    return data as SavedLayout
  }
}
