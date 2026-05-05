-- Remote-applied duplicate of drop_allow_all_policies.
-- Kept locally so Supabase migration history matches production.

DROP POLICY IF EXISTS "Allow All" ON profiles;
DROP POLICY IF EXISTS "Allow All" ON user_roles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
