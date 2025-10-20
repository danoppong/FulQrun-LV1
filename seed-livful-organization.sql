-- Seed LivFul Inc. organization if it doesn't already exist
-- Safe to run multiple times

INSERT INTO organizations (id, name, domain)
SELECT gen_random_uuid(), 'LivFul Inc.', 'livful.com'
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE lower(name) = 'livful inc.'
);

-- Optional: ensure a default organization exists as well (no-op if present)
INSERT INTO organizations (id, name, domain)
SELECT '00000000-0000-0000-0000-000000000001', 'Default Organization', 'default.local'
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'
);
