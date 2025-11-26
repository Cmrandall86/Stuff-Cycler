-- TEST THE EXACT QUERY THE FRONTEND IS MAKING
-- Run these queries step by step to find where it fails

-- ============================================================
-- Test 1: Simple items query (no join)
-- ============================================================
SELECT 'Test 1: Simple items query' as test;

SELECT 
    id,
    title,
    description,
    status,
    created_at
FROM items
ORDER BY created_at DESC
LIMIT 50;

-- If this fails, the problem is with items table RLS

-- ============================================================
-- Test 2: Items with item_images join (EXACTLY like frontend)
-- ============================================================
SELECT 'Test 2: Items with item_images join' as test;

SELECT 
    items.id,
    items.title,
    items.description,
    items.status,
    items.created_at,
    item_images.id as image_id,
    item_images.path as image_path,
    item_images.sort_order as image_sort_order
FROM items
LEFT JOIN item_images ON item_images.item_id = items.id
ORDER BY items.created_at DESC
LIMIT 50;

-- If this fails but Test 1 works, the problem is with item_images RLS

-- ============================================================
-- Test 3: Check if it's a recursion issue
-- ============================================================
SELECT 'Test 3: Test for recursion' as test;

-- Try to select a single public item
SELECT *
FROM items
WHERE visibility = 'public'
LIMIT 1;

-- If this fails with recursion error, items policy has recursion

-- ============================================================
-- Test 4: Check item_images alone
-- ============================================================
SELECT 'Test 4: Item images standalone' as test;

SELECT *
FROM item_images
LIMIT 10;

-- If this fails, item_images RLS has an issue

-- ============================================================
-- Test 5: Test as specific user (replace with your user ID)
-- ============================================================
SELECT 'Test 5: Test as specific user' as test;

-- First, get your user ID
SELECT auth.uid() as current_user_id;

-- Then test if you can see items
SELECT 
    id,
    title,
    owner_id,
    visibility
FROM items
WHERE owner_id = auth.uid()
LIMIT 5;

-- ============================================================
-- RESULTS INTERPRETATION
-- ============================================================
/*
If Test 1 FAILS:
  → Problem is with items SELECT policy
  → Check for recursion in items policy

If Test 1 WORKS but Test 2 FAILS:
  → Problem is with item_images SELECT policy
  → Check for recursion in item_images policy

If Test 3 FAILS with recursion:
  → items policy has infinite loop
  → Likely checking item_visibility_groups which checks items

If Test 4 FAILS with recursion:
  → item_images policy has infinite loop
  → Likely checking items which checks item_images

If ALL tests FAIL:
  → RLS is completely broken
  → Run TEMP-DISABLE-RLS.sql to bypass and test
*/

