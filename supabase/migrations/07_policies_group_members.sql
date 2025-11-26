-- ============================================================
-- Migration: Updated RLS policies for group_members
-- ============================================================
-- Purpose: Control membership operations with single-owner protection
-- ============================================================

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "group_members: read in my groups" ON public.group_members;
DROP POLICY IF EXISTS "group_members: owner adds or self join" ON public.group_members;
DROP POLICY IF EXISTS "group_members: leave or owner removes" ON public.group_members;
DROP POLICY IF EXISTS "gm_select" ON public.group_members;
DROP POLICY IF EXISTS "gm_insert" ON public.group_members;
DROP POLICY IF EXISTS "gm_update" ON public.group_members;
DROP POLICY IF EXISTS "gm_delete" ON public.group_members;

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

-- INSERT: owner/admin can add members
CREATE POLICY "gm_insert" ON public.group_members 
FOR INSERT 
TO authenticated
WITH CHECK (
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

-- ✓ RLS policies for group_members updated with single-owner protection
SELECT '✓ RLS policies for group_members updated with single-owner protection' AS status;

