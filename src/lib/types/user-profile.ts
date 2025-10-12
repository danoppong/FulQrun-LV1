export type Role = 'salesman' | 'manager' | 'admin' | 'super_admin'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: Role | null
  organization_id: string
  manager_id: string | null
  // Optional extended fields (present in some deployments)
  enterprise_role?: string | null
  department?: string | null
  cost_center?: string | null
  region?: string | null
  country?: string | null
  business_unit?: string | null
  hire_date?: string | null
  last_login_at?: string | null
  mfa_enabled?: boolean | null
  session_timeout_minutes?: number | null
  learning_progress?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UpdateUserProfileInput {
  full_name?: string | null
  manager_id?: string | null
}
