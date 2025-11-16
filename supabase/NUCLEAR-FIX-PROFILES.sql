-- ============================================================
-- NUCLEAR FIX: Drop ALL profiles policies and recreate
-- ============================================================

-- First, let's see what we have
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple policies with NO recursion
-- SELECT: Any authenticated user can read any profile
CREATE POLICY "profiles_select_simple" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_simple" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_simple" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (id = auth.uid());

-- DELETE: Users can delete their own profile (optional)
CREATE POLICY "profiles_delete_simple" 
  ON public.profiles 
  FOR DELETE 
  TO authenticated 
  USING (id = auth.uid());

-- Show final policies
SELECT 
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'USING: ' || qual ELSE '' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'CHECK: ' || with_check ELSE '' END as check_clause
FROM pg_policies
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

SELECT '✓ All profiles policies nuked and recreated' AS status;

