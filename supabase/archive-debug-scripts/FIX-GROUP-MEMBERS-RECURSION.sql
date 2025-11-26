-- Fix group_members recursion
-- The issue: The SELECT policy checks group_members again, causing a loop

DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- Simple fix: Just let users see their own memberships
-- (We can expand this later if needed)
CREATE POLICY "group_members_select" ON group_members
FOR SELECT
USING (
  -- You can see your own membership records
  user_id = auth.uid()
);

SELECT '✓ group_members recursion fixed!' as result;
SELECT 'Refresh your browser to test groups page' as instruction;

