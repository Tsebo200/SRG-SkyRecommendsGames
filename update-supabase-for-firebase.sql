-- Update Supabase schema to work with Firebase authentication
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: CREATE USERS TABLE FOR FIREBASE MAPPING
-- ===========================================

-- Create a users table to map Firebase UIDs to Supabase user IDs
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid text UNIQUE NOT NULL,
  email text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- STEP 2: UPDATE FAVOURITES TABLE
-- ===========================================

-- Update favourites table to use the users table
ALTER TABLE public.favourites 
ADD COLUMN IF NOT EXISTS user_id_new uuid REFERENCES public.users(id);

-- Migrate existing data (if any)
UPDATE public.favourites 
SET user_id_new = (
  SELECT u.id 
  FROM public.users u 
  WHERE u.firebase_uid = public.favourites.user_id::text
)
WHERE user_id_new IS NULL;

-- ===========================================
-- STEP 3: CREATE RLS POLICIES
-- ===========================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Update favourites RLS policy to work with new user_id
DROP POLICY IF EXISTS "Allow authenticated users to manage favourites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to read favourites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to delete favourites" ON public.favourites;
DROP POLICY IF EXISTS "Allow authenticated users to create favourites" ON public.favourites;

-- Create new RLS policies for favourites
CREATE POLICY "Users can manage own favourites" ON public.favourites
  FOR ALL USING (
    user_id_new IN (
      SELECT id FROM public.users 
      WHERE firebase_uid = auth.uid()::text
    )
  );

-- ===========================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ===========================================

-- Function to get Supabase user ID from Firebase UID
CREATE OR REPLACE FUNCTION get_supabase_user_id(firebase_uid_param text)
RETURNS uuid AS $$
DECLARE
  user_id_result uuid;
BEGIN
  SELECT id INTO user_id_result 
  FROM public.users 
  WHERE firebase_uid = firebase_uid_param;
  
  RETURN user_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user mapping
CREATE OR REPLACE FUNCTION create_user_mapping(
  firebase_uid_param text,
  email_param text DEFAULT NULL,
  display_name_param text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  user_id_result uuid;
BEGIN
  -- Try to get existing user
  SELECT id INTO user_id_result 
  FROM public.users 
  WHERE firebase_uid = firebase_uid_param;
  
  -- If user doesn't exist, create it
  IF user_id_result IS NULL THEN
    INSERT INTO public.users (firebase_uid, email, display_name)
    VALUES (firebase_uid_param, email_param, display_name_param)
    RETURNING id INTO user_id_result;
  END IF;
  
  RETURN user_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 5: CREATE TRIGGERS
-- ===========================================

-- Trigger to automatically create user mapping when favourites are added
CREATE OR REPLACE FUNCTION handle_favourite_user_mapping()
RETURNS TRIGGER AS $$
DECLARE
  supabase_user_id uuid;
BEGIN
  -- Get or create user mapping
  SELECT create_user_mapping(
    NEW.user_id::text,
    NULL,
    NULL
  ) INTO supabase_user_id;
  
  -- Update the user_id_new field
  NEW.user_id_new = supabase_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS favourites_user_mapping_trigger ON public.favourites;
CREATE TRIGGER favourites_user_mapping_trigger
  BEFORE INSERT ON public.favourites
  FOR EACH ROW
  EXECUTE FUNCTION handle_favourite_user_mapping();

-- ===========================================
-- STEP 6: VERIFY SETUP
-- ===========================================

-- Test the setup
SELECT 'Database updated for Firebase authentication!' as status;

-- Show the new structure
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'favourites')
ORDER BY table_name, ordinal_position;
