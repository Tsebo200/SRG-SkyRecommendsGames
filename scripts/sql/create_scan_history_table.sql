-- Create dedicated scan_history table with proper foreign key to users table
-- Run this SQL command in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('qr_code', 'barcode', 'manual')),
  scan_data JSONB NOT NULL,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL,
  game_name TEXT,
  game_id TEXT,
  platform TEXT,
  cover_art TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_date ON scan_history(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_game_id ON scan_history(game_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_type ON scan_history(scan_type);

-- Create GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_data ON scan_history USING GIN (scan_data);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_scan_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scan_history_updated_at
  BEFORE UPDATE ON scan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_history_updated_at();

-- Disable RLS for now (since we're using Firebase auth)
ALTER TABLE scan_history DISABLE ROW LEVEL SECURITY;

-- Drop the old scan_history column from users table (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS scan_history;
