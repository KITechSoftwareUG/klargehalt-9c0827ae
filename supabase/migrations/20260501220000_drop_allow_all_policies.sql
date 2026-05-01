-- Remove insecure "Allow All" policies that grant anonymous public read/write access.
-- Both tables have proper authenticated policies already in place.
DROP POLICY IF EXISTS "Allow All" ON profiles;
DROP POLICY IF EXISTS "Allow All" ON user_roles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
