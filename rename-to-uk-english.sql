-- Rename tables from US English to UK English
-- Run this in your Supabase SQL Editor

-- 1. Rename 'favorites' table to 'favourites'
ALTER TABLE public.favorites RENAME TO favourites;

-- 2. Update any references in RLS policies
-- Drop existing policies on the old table name
DROP POLICY IF EXISTS "Allow authenticated users to manage favorites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to read favorites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to delete favorites" ON public.favourites;

-- Create new policies with UK English naming
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

-- 3. If you have any other US English tables, rename them too
-- (Add more ALTER TABLE statements here if needed)

-- 4. Verify the changes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('favourites', 'favorites');
