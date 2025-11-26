-- COMPREHENSIVE DIAGNOSTICS - Run this to see the actual state of your database
-- This will help us understand what's really happening

-- ============================================================
-- 1. Check if helper function exists
-- ============================================================
SELECT 'Helper Function Check:' as section;

SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    provolatile as volatility
FROM pg_proc
WHERE proname = 'user_in_item_groups';

-- ============================================================
-- 2. List ALL RLS policies on items table
-- ============================================================
SELECT '==================' as section;
SELECT 'Items Table Policies:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'items'
ORDER BY policyname;

-- ============================================================
-- 3. List ALL RLS policies on item_images table
-- ============================================================
SELECT '==================' as section;
SELECT 'Item Images Table Policies:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'item_images'
ORDER BY policyname;

-- ============================================================
-- 4. List ALL RLS policies on item_visibility_groups table
-- ============================================================
SELECT '==================' as section;
SELECT 'Item Visibility Groups Table Policies:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'item_visibility_groups'
ORDER BY policyname;

-- ============================================================
-- 5. List ALL RLS policies on groups table
-- ============================================================
SELECT '==================' as section;
SELECT 'Groups Table Policies:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY policyname;

-- ============================================================
-- 6. List ALL RLS policies on group_members table
-- ============================================================
SELECT '==================' as section;
SELECT 'Group Members Table Policies:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY policyname;

-- ============================================================
-- 7. Check RLS status on all tables
-- ============================================================
SELECT '==================' as section;
SELECT 'RLS Status on All Tables:' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('items', 'item_images', 'item_visibility_groups', 'groups', 'group_members')
ORDER BY tablename;

-- ============================================================
-- 8. Count data in tables
-- ============================================================
SELECT '==================' as section;
SELECT 'Data Counts:' as section;

SELECT 'items' as table_name, COUNT(*) as row_count FROM items
UNION ALL
SELECT 'item_images', COUNT(*) FROM item_images
UNION ALL
SELECT 'item_visibility_groups', COUNT(*) FROM item_visibility_groups
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM group_members;

-- ============================================================
-- 9. Check for items with visibility='public'
-- ============================================================
SELECT '==================' as section;
SELECT 'Public Items:' as section;

SELECT 
    id,
    title,
    visibility,
    owner_id,
    created_at
FROM items
WHERE visibility = 'public'
LIMIT 5;

-- ============================================================
-- 10. Sample items data
-- ============================================================
SELECT '==================' as section;
SELECT 'Sample Items (first 3):' as section;

SELECT 
    id,
    title,
    visibility,
    status,
    owner_id
FROM items
ORDER BY created_at DESC
LIMIT 3;

