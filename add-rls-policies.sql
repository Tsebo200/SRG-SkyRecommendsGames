-- RLS Policies for Games and Favorites Tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on tables (if not already enabled)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to create games" ON public.games;
DROP POLICY IF EXISTS "Allow authenticated users to manage favorites" ON public.favorites;

-- Allow authenticated users to create games
CREATE POLICY "Allow authenticated users to create games" ON public.games
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read games
CREATE POLICY "Allow authenticated users to read games" ON public.games
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to manage favorites
CREATE POLICY "Allow authenticated users to manage favorites" ON public.favorites
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read favorites
CREATE POLICY "Allow authenticated users to read favorites" ON public.favorites
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
