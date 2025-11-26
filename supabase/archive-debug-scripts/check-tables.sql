-- Run this query to see what tables exist and their columns
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name LIKE 'item%'
ORDER BY 
    table_name, ordinal_position;

