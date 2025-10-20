-- Dashboard Role Templates table and RLS

-- Enable extensions if not present (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.dashboard_role_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  name text NOT NULL,
  layout_json jsonb NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill column if table pre-existed without it
ALTER TABLE public.dashboard_role_templates
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Helpful compound index prioritizing defaults and recency
CREATE INDEX IF NOT EXISTS idx_dashboard_role_templates_org_role_default
  ON public.dashboard_role_templates (organization_id, role, is_default DESC, published_at DESC);

ALTER TABLE public.dashboard_role_templates ENABLE ROW LEVEL SECURITY;

-- Allow org members to read templates of their org
DROP POLICY IF EXISTS "drt_select_org_members" ON public.dashboard_role_templates;
CREATE POLICY "drt_select_org_members" ON public.dashboard_role_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = dashboard_role_templates.organization_id
    )
  );

-- Allow admins/managers of the org to insert (publish) templates
DROP POLICY IF EXISTS "drt_insert_admin_manager" ON public.dashboard_role_templates;
CREATE POLICY "drt_insert_admin_manager" ON public.dashboard_role_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = dashboard_role_templates.organization_id
        AND u.role IN ('admin','manager')
    )
  );

-- Optionally allow update/delete to admins/managers
DROP POLICY IF EXISTS "drt_update_admin_manager" ON public.dashboard_role_templates;
CREATE POLICY "drt_update_admin_manager" ON public.dashboard_role_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = dashboard_role_templates.organization_id
        AND u.role IN ('admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = dashboard_role_templates.organization_id
        AND u.role IN ('admin','manager')
    )
  );

DROP POLICY IF EXISTS "drt_delete_admin_manager" ON public.dashboard_role_templates;
CREATE POLICY "drt_delete_admin_manager" ON public.dashboard_role_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = dashboard_role_templates.organization_id
        AND u.role IN ('admin','manager')
    )
  );

-- Note: The API ensures only one default per org+role by unsetting others before setting a new default.
