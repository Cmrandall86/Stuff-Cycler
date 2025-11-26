-- ============================================================
-- FIX: Profiles RLS Infinite Recursion
-- ============================================================
-- Problem: profiles policies are causing infinite recursion
-- Solution: Simplify to allow authenticated users to read profiles
-- ============================================================

-- Drop existing profiles policies
DROP POLICY IF EXISTS "profiles: read self" ON public.profiles;
DROP POLICY IF EXISTS "profiles: read within my groups" ON public.profiles;
DROP POLICY IF EXISTS "profiles: read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Create simple, non-recursive profiles policies
-- Allow authenticated users to read all profiles (for group member names, etc.)
CREATE POLICY "profiles_select_authenticated" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (id = auth.uid());

-- ✓ Profiles policies updated - no recursion
SELECT '✓ Profiles policies fixed - authenticated users can read all profiles' AS status;

