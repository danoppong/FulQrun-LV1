-- Create public storage bucket `branding` and RLS policies for per-organization prefixes
-- Run this in Supabase SQL editor or via CLI. Safe to re-run.

-- 1) Create bucket if missing (public=true for public URLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'branding'
  ) THEN
    -- Create bucket via direct INSERT for broad compatibility
    BEGIN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('branding', 'branding', true);
    EXCEPTION
      WHEN undefined_column THEN
        -- Older schema may not have the 'name' column
        INSERT INTO storage.buckets (id, public)
        VALUES ('branding', true);
      WHEN unique_violation THEN
        -- Bucket created concurrently; ignore
        NULL;
    END;
  END IF;
END $$;

-- 2) Ensure RLS is enabled on storage.objects (only if current user owns the table)
DO $$
DECLARE
  v_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO v_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'objects' AND n.nspname = 'storage';

  IF v_owner = current_user THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
  ELSE
    RAISE NOTICE 'Skipping RLS enable on storage.objects: owner is %, current_user is %', v_owner, current_user;
  END IF;
END $$;

-- 3) Policies
-- Allow public read of objects in branding bucket
DO $$
DECLARE
  v_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO v_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'objects' AND n.nspname = 'storage';

  IF v_owner = current_user THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'branding_public_read'
    ) THEN
      CREATE POLICY branding_public_read ON storage.objects
        FOR SELECT
        USING (bucket_id = 'branding');
    END IF;
  ELSE
    RAISE NOTICE 'Skipping policy branding_public_read: owner is %, current_user is %', v_owner, current_user;
  END IF;
END $$;

-- Helper: current user's organization id
-- We assume a table `public.users` mapping auth.uid() -> organization_id
-- Adjust schema/table name if your users table lives elsewhere.

-- Allow authenticated users to upload only within their org prefix: `${orgId}/...`
DO $$
DECLARE
  v_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO v_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'objects' AND n.nspname = 'storage';

  IF v_owner = current_user THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'branding_org_insert'
    ) THEN
      CREATE POLICY branding_org_insert ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'branding'
          AND (
            CASE
              WHEN EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid()
              ) THEN (
                -- name starts with '<orgId>/'
                position((SELECT u.organization_id::text || '/' FROM public.users u WHERE u.id = auth.uid()) in name) = 1
              )
              ELSE false
            END
          )
        );
    END IF;
  ELSE
    RAISE NOTICE 'Skipping policy branding_org_insert: owner is %, current_user is %', v_owner, current_user;
  END IF;
END $$;

-- Allow updates only within same org prefix
DO $$
DECLARE
  v_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO v_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'objects' AND n.nspname = 'storage';

  IF v_owner = current_user THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'branding_org_update'
    ) THEN
      CREATE POLICY branding_org_update ON storage.objects
        FOR UPDATE TO authenticated
        USING (
          bucket_id = 'branding' AND (
            CASE
              WHEN EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid()
              ) THEN (
                position((SELECT u.organization_id::text || '/' FROM public.users u WHERE u.id = auth.uid()) in name) = 1
              )
              ELSE false
            END
          )
        )
        WITH CHECK (
          bucket_id = 'branding' AND (
            CASE
              WHEN EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid()
              ) THEN (
                position((SELECT u.organization_id::text || '/' FROM public.users u WHERE u.id = auth.uid()) in name) = 1
              )
              ELSE false
            END
          )
        );
    END IF;
  ELSE
    RAISE NOTICE 'Skipping policy branding_org_update: owner is %, current_user is %', v_owner, current_user;
  END IF;
END $$;

-- Allow deletes only within same org prefix
DO $$
DECLARE
  v_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO v_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'objects' AND n.nspname = 'storage';

  IF v_owner = current_user THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'branding_org_delete'
    ) THEN
      CREATE POLICY branding_org_delete ON storage.objects
        FOR DELETE TO authenticated
        USING (
          bucket_id = 'branding' AND (
            CASE
              WHEN EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid()
              ) THEN (
                position((SELECT u.organization_id::text || '/' FROM public.users u WHERE u.id = auth.uid()) in name) = 1
              )
              ELSE false
            END
          )
        );
    END IF;
  ELSE
    RAISE NOTICE 'Skipping policy branding_org_delete: owner is %, current_user is %', v_owner, current_user;
  END IF;
END $$;

-- Notes:
-- - The upload API stores objects at path `${orgId}/<filename>`, which this policy enforces.
-- - Public read uses the bucket's public property and policy above for direct PostgREST access.
-- - If your users table lives under a different schema or has a different name/columns, adjust references accordingly.
