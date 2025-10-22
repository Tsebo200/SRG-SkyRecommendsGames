-- Create scan_history table for storing QR code scan data
CREATE TABLE scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_history_scan_date ON scan_history(scan_date);
CREATE INDEX idx_scan_history_scan_type ON scan_history(scan_type);
CREATE INDEX idx_scan_history_game_id ON scan_history(game_id);

-- Disable RLS for hybrid auth (handled by application layer)
-- ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (disabled for hybrid auth - handled by application layer)
-- Note: RLS policies are disabled because we use Firebase auth with Supabase data
-- The application layer handles user authentication and data access control

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scan_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scan_history_updated_at
  BEFORE UPDATE ON scan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_history_updated_at();
