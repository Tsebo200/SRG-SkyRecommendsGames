-- Convert Supabase Database from US English to UK English
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: BACKUP EXISTING DATA
-- ===========================================

-- Create backup tables (optional safety measure)
CREATE TABLE IF NOT EXISTS favorites_backup AS SELECT * FROM public.favorites;

-- ===========================================
-- STEP 2: RENAME TABLES
-- ===========================================

-- Rename 'favorites' table to 'favourites'
ALTER TABLE public.favorites RENAME TO favourites;

-- ===========================================
-- STEP 3: UPDATE RLS POLICIES
-- ===========================================

-- Drop all existing policies on the old table name
DROP POLICY IF EXISTS "Allow authenticated users to manage favorites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to read favorites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to delete favorites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to create favorites" ON public.favourites;
DROP POLICY IF EXISTS "user can manage own favorites" ON public.favourites;
DROP POLICY IF EXISTS "authenticated_users_favorites" ON public.favourites;

-- Create new UK English policies
CREATE POLICY "Allow authenticated users to manage favourites" ON public.favourites
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read favourites" ON public.favourites
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete favourites" ON public.favourites
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create favourites" ON public.favourites
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- STEP 4: UPDATE ANY FUNCTIONS OR TRIGGERS
-- ===========================================

-- Check if there are any functions that reference the old table name
-- (This will show any functions that need updating)
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%favorites%'
AND routine_schema = 'public';

-- ===========================================
-- STEP 5: VERIFY CHANGES
-- ===========================================

-- Verify table exists with new name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'favourites';

-- Verify RLS policies exist
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'favourites'
AND schemaname = 'public';

-- Check data integrity
SELECT COUNT(*) as total_favourites FROM public.favourites;

-- ===========================================
-- STEP 6: CLEANUP (Optional)
-- ===========================================

-- Drop backup table if everything looks good
-- DROP TABLE IF EXISTS favorites_backup;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

SELECT 'Database successfully converted to UK English!' as status;
