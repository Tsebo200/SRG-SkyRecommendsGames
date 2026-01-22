-- Disable RLS on scan_history table for hybrid authentication
ALTER TABLE scan_history DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies on scan_history
DROP POLICY IF EXISTS "Users can view their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can insert their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can update their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can delete their own scan history" ON scan_history;
