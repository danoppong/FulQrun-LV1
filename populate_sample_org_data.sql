-- Populate organization_data table with sample regions and countries
-- Run this to add some test data for regions and countries

-- Insert sample regions (replace 'your-org-id' with actual organization ID)
INSERT INTO organization_data (organization_id, type, name, code, description, is_active) VALUES
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'region', 'North America', 'NA', 'North American region', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'region', 'Europe', 'EU', 'European region', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'region', 'Asia Pacific', 'AP', 'Asia Pacific region', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'region', 'Africa', 'AF', 'African region', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'region', 'Latin America', 'LA', 'Latin American region', true)
ON CONFLICT (organization_id, type, name) DO NOTHING;

-- Insert sample countries
INSERT INTO organization_data (organization_id, type, name, code, description, is_active) VALUES
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'United States', 'US', 'United States of America', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Canada', 'CA', 'Canada', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'United Kingdom', 'GB', 'United Kingdom', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Germany', 'DE', 'Germany', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'France', 'FR', 'France', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Japan', 'JP', 'Japan', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Australia', 'AU', 'Australia', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Ghana', 'GH', 'Ghana', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'South Africa', 'ZA', 'South Africa', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Brazil', 'BR', 'Brazil', true),
  ('9ed327f2-c46a-445a-952b-70addaee33b8', 'country', 'Mexico', 'MX', 'Mexico', true)
ON CONFLICT (organization_id, type, name) DO NOTHING;

-- Verify the data was inserted
SELECT type, name, code FROM organization_data 
WHERE organization_id = '9ed327f2-c46a-445a-952b-70addaee33b8' 
AND type IN ('region', 'country') 
ORDER BY type, name;