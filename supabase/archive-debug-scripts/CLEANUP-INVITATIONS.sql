-- ============================================================
-- Database Cleanup: Remove Invitation System
-- ============================================================
-- Purpose: Clean up invitation and join request tables and functions
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop invitation and join request tables
DROP TABLE IF EXISTS public.group_invitations CASCADE;
DROP TABLE IF EXISTS public.group_join_requests CASCADE;

-- Drop the invitation trigger function
DROP FUNCTION IF EXISTS public.populate_invitee_id() CASCADE;

-- ✓ Invitation system cleaned up
SELECT '✓ Invitation and join request tables and functions dropped' AS status;

