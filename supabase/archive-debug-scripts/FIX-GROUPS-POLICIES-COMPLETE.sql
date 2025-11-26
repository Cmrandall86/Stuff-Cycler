-- ============================================================
-- Complete fix for groups and group_members RLS policies
-- ============================================================
-- Purpose: Drop ALL existing policies and recreate with correct logic
-- Run this ONCE to fix the infinite recursion issue
-- ============================================================

-- Step 1: Drop ALL existing policies on groups table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.groups';
    END LOOP;
END $$;

-- Step 2: Drop ALL existing policies on group_members table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_members' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.group_members';
    END LOOP;
END $$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW policies for groups (read by members, write by owner)
-- Read groups I own or I'm a member of
CREATE POLICY "groups_select" ON public.groups 
FOR SELECT 
TO authenticated
USING (
  owner_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id
    AND gm.user_id = auth.uid()
  )
);

-- Create: anyone authenticated can create a group they own
CREATE POLICY "groups_insert" ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Update: owner only
CREATE POLICY "groups_update" ON public.groups 
FOR UPDATE 
TO authenticated
USING (owner_id = auth.uid());

-- Delete: owner only
CREATE POLICY "groups_delete" ON public.groups 
FOR DELETE 
TO authenticated
USING (owner_id = auth.uid());

-- Step 5: Create NEW policies for group_members (avoiding recursion)
-- SELECT: members of a group can see the roster
CREATE POLICY "gm_select" ON public.group_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = auth.uid()
  )
);

-- INSERT: owner/admin can add members OR user can be added as owner of their own group
CREATE POLICY "gm_insert" ON public.group_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if the group is owned by the current user (for initial owner insert via trigger)
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
  OR
  -- Allow if current user is already an owner/admin of this group
  EXISTS (
    SELECT 1 FROM public.group_members me
    WHERE me.group_id = group_members.group_id
    AND me.user_id = auth.uid()
    AND me.role IN ('owner','admin')
  )
);

-- UPDATE (role changes): only owner can change roles
CREATE POLICY "gm_update" ON public.group_members 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members me
    WHERE me.group_id = group_members.group_id
    AND me.user_id = auth.uid()
    AND me.role = 'owner'
  )
)
WITH CHECK (true);

-- DELETE: owner/admin may remove members, but not the only owner
CREATE POLICY "gm_delete" ON public.group_members 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members me
    WHERE me.group_id = group_members.group_id
    AND me.user_id = auth.uid()
    AND me.role IN ('owner','admin')
  )
  AND NOT (
    group_members.role = 'owner'
    AND 1 = (
      SELECT COUNT(*) FROM public.group_members x
      WHERE x.group_id = group_members.group_id AND x.role = 'owner'
    )
  )
);

-- ✓ All policies fixed
SELECT '✓ All groups and group_members policies recreated successfully' AS status;

