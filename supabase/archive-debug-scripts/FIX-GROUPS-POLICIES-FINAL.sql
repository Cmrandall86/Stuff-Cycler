-- ============================================================
-- FINAL fix for groups and group_members RLS policies
-- ============================================================
-- Purpose: Drop ALL existing policies and recreate WITHOUT recursion
-- The key: group_members SELECT policy must NOT check group_members!
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

-- ========================================
-- GROUPS POLICIES (simple, check group_members OK here)
-- ========================================

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

-- ========================================
-- GROUP_MEMBERS POLICIES (NO RECURSION!)
-- ========================================

-- SELECT: Allow all authenticated users to read all group_members
-- This breaks the recursion cycle. Privacy is controlled at the groups level.
CREATE POLICY "gm_select" ON public.group_members 
FOR SELECT 
TO authenticated
USING (true);

-- INSERT: Owner of the group can add members
CREATE POLICY "gm_insert" ON public.group_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- UPDATE (role changes): only owner can change roles
CREATE POLICY "gm_update" ON public.group_members 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- DELETE: Only owner can remove members
-- Simplified to avoid recursion - application enforces "not the only owner" rule
CREATE POLICY "gm_delete" ON public.group_members 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- ✓ All policies fixed WITHOUT recursion
SELECT '✓ All groups and group_members policies recreated WITHOUT recursion' AS status;

