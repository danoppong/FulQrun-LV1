-- Create user_profiles table for role-based access
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'salesman',
  manager_id UUID REFERENCES user_profiles(id),
  region TEXT,
  business_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_dashboard_layouts table for custom dashboard layouts
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create team_members table for hierarchical relationships
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manager_id, member_id)
);

-- Insert sample user profiles with different roles
INSERT INTO user_profiles (user_id, name, role, region, business_unit) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Smith', 'salesman', 'North America', 'Enterprise'),
  ('00000000-0000-0000-0000-000000000002', 'Sarah Johnson', 'sales_manager', 'North America', 'Enterprise'),
  ('00000000-0000-0000-0000-000000000003', 'Mike Davis', 'regional_sales_director', 'North America', 'Enterprise'),
  ('00000000-0000-0000-0000-000000000004', 'Lisa Chen', 'global_sales_lead', 'Global', 'Enterprise'),
  ('00000000-0000-0000-0000-000000000005', 'Robert Wilson', 'business_unit_head', 'Global', 'Enterprise');

-- Set up hierarchical relationships
UPDATE user_profiles SET manager_id = '00000000-0000-0000-0000-000000000002' WHERE user_id = '00000000-0000-0000-0000-000000000001';
UPDATE user_profiles SET manager_id = '00000000-0000-0000-0000-000000000003' WHERE user_id = '00000000-0000-0000-0000-000000000002';
UPDATE user_profiles SET manager_id = '00000000-0000-0000-0000-000000000004' WHERE user_id = '00000000-0000-0000-0000-000000000003';
UPDATE user_profiles SET manager_id = '00000000-0000-0000-0000-000000000005' WHERE user_id = '00000000-0000-0000-0000-000000000004';

-- Insert team member relationships
INSERT INTO team_members (manager_id, member_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004');

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view their team members" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.manager_id = user_profiles.id
      AND tm.member_id = (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create RLS policies for user_dashboard_layouts
CREATE POLICY "Users can manage their own dashboard layout" ON user_dashboard_layouts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for team_members
CREATE POLICY "Users can view their team relationships" ON team_members
  FOR SELECT USING (
    manager_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR member_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Create function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM user_profiles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's team members
CREATE OR REPLACE FUNCTION get_team_members(user_uuid UUID)
RETURNS TABLE(member_id UUID, name TEXT, role TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as member_id,
    up.name,
    up.role,
    au.email
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  JOIN team_members tm ON tm.member_id = up.id
  WHERE tm.manager_id = (
    SELECT id FROM user_profiles WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
