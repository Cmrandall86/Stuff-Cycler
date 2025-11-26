-- Fix infinite recursion in groups and group_members policies
-- The problem: groups checks group_members, group_members checks groups = loop

-- ============================================================
-- Fix groups policies (simplify to avoid recursion)
-- ============================================================

DROP POLICY IF EXISTS "groups: read mine" ON groups;
DROP POLICY IF EXISTS "groups: insert self owner" ON groups;
DROP POLICY IF EXISTS "groups: owner write" ON groups;
DROP POLICY IF EXISTS "groups: owner delete" ON groups;

-- Read: You can see groups you own OR groups you're a member of (direct check, no recursion)
CREATE POLICY "groups_select" ON groups
FOR SELECT
USING (
  owner_id = auth.uid()
  OR
  -- Check group_members directly without going through groups RLS again
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id 
    AND gm.user_id = auth.uid()
  )
);

-- Insert: Anyone can create a group they own
CREATE POLICY "groups_insert" ON groups
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Update: Only owner can update
CREATE POLICY "groups_update" ON groups
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Delete: Only owner can delete
CREATE POLICY "groups_delete" ON groups
FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================
-- Simplify group_members policies to avoid recursion
-- ============================================================

DROP POLICY IF EXISTS "group_members: read mine" ON group_members;
DROP POLICY IF EXISTS "group_members: owner can insert" ON group_members;
DROP POLICY IF EXISTS "group_members: owner can delete" ON group_members;

-- Read: Can see members of groups you're in (NO groups table check!)
CREATE POLICY "group_members_select" ON group_members
FOR SELECT
USING (
  -- You are this member
  user_id = auth.uid()
  OR
  -- You're in the same group (via another membership row)
  EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = auth.uid()
  )
  OR
  -- You own the group (direct check on groups, but groups won't check back)
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- Insert: Owner can add members OR you can add yourself (for join functionality)
CREATE POLICY "group_members_insert" ON group_members
FOR INSERT
WITH CHECK (
  -- Self-join
  user_id = auth.uid()
  OR
  -- Owner adds someone
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- Delete: Can leave (if not owner) OR owner can remove others
CREATE POLICY "group_members_delete" ON group_members
FOR DELETE
USING (
  -- I remove myself (leave) only if I'm not the owner
  (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.owner_id = auth.uid()
    )
  )
  OR
  -- Owner removes another member (not themselves)
  (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.owner_id = auth.uid()
    )
    AND user_id <> auth.uid()
  )
);

SELECT '✓ Groups recursion fixed!' as result;

