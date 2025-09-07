-- Aggressive RLS fix - completely reset and rebuild policies
-- This will temporarily disable RLS, remove all policies, and recreate them properly

-- Step 1: Disable RLS on all tables temporarily
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (this will work even if they don't exist)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('users', 'organizations', 'companies', 'contacts', 'leads', 'opportunities', 'activities', 'integrations')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies
-- Organizations: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on organizations" ON organizations
    FOR ALL USING (true);

-- Users: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Companies: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true);

-- Contacts: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on contacts" ON contacts
    FOR ALL USING (true);

-- Leads: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on leads" ON leads
    FOR ALL USING (true);

-- Opportunities: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on opportunities" ON opportunities
    FOR ALL USING (true);

-- Activities: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on activities" ON activities
    FOR ALL USING (true);

-- Integrations: Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on integrations" ON integrations
    FOR ALL USING (true);
