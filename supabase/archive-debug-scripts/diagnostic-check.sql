-- Diagnostic Script: Check database state
-- Run this in Supabase SQL Editor to see what exists

-- 1. Check all item-related tables
SELECT 
    'Tables:' as check_type,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND table_name LIKE '%item%'
ORDER BY 
    table_name;

-- 2. Check columns in item_images (if it exists)
SELECT 
    'item_images columns:' as check_type,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'item_images'
ORDER BY 
    ordinal_position;

-- 3. Check RLS policies on item_images
SELECT 
    'item_images policies:' as check_type,
    policyname,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'item_images';

-- 4. Check if RLS is enabled
SELECT 
    'RLS status:' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename IN ('items', 'item_images', 'item_visibility_groups')
ORDER BY
    tablename;

-- 5. Count rows in items table
SELECT 
    'Row counts:' as check_type,
    'items' as table_name,
    COUNT(*) as count
FROM 
    items;

-- 6. Try to select from item_images directly (bypass RLS for diagnostics)
SELECT 
    'item_images sample:' as check_type,
    *
FROM 
    item_images
LIMIT 5;

