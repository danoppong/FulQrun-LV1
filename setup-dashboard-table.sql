-- Create user_dashboard_layouts table
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own dashboard layouts
CREATE POLICY "Users can access their own dashboard layouts" ON user_dashboard_layouts
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_dashboard_layouts TO authenticated;
GRANT ALL ON user_dashboard_layouts TO service_role;
