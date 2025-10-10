-- Create a SECURITY DEFINER RPC to safely expose only id + name for organizations
-- This avoids relaxing table RLS and works with anon or authenticated keys.

-- Function: public.get_public_organizations()
CREATE OR REPLACE FUNCTION public.get_public_organizations()
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT o.id, o.name
  FROM public.organizations o
  ORDER BY o.name ASC;
$$;

-- Ensure ownership; replace 'postgres' with your DB owner if different
ALTER FUNCTION public.get_public_organizations() OWNER TO postgres;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_public_organizations() TO anon, authenticated;
