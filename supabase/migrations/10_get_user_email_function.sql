-- ============================================================
-- Migration: Function to get user email from auth.users
-- ============================================================
-- Purpose: Allow authenticated users to look up emails for user search
--          (needed because auth.users is not directly accessible)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  -- Look up email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;

-- ✓ Function to get user email created
SELECT '✓ Function get_user_email created' AS status;

