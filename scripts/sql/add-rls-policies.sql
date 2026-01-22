-- RLS Policies for Games and Favourites Tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on tables (if not already enabled)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to create games" ON public.games;
DROP POLICY IF EXISTS "Allow authenticated users to manage favourites" ON public.favourites;

-- Allow authenticated users to create games
CREATE POLICY "Allow authenticated users to create games" ON public.games
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read games
CREATE POLICY "Allow authenticated users to read games" ON public.games
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to manage favourites
CREATE POLICY "Allow authenticated users to manage favourites" ON public.favourites
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read favourites
CREATE POLICY "Allow authenticated users to read favourites" ON public.favourites
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
