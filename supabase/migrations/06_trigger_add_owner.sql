-- ============================================================
-- Migration: Trigger to auto-add owner to group_members
-- ============================================================
-- Purpose: Automatically create owner membership when group is created
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_groups_add_owner ON public.groups;

-- Create trigger that fires after group creation
CREATE TRIGGER trg_groups_add_owner
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.add_owner_membership();

-- Add comment for documentation
COMMENT ON FUNCTION public.add_owner_membership() IS 'Automatically adds group creator as owner in group_members';

-- ✓ Trigger to auto-add owner created
SELECT '✓ Trigger to auto-add owner created' AS status;

