-- Add scan_history column to users table instead of separate table
ALTER TABLE users ADD COLUMN scan_history JSONB DEFAULT '[]'::jsonb;

-- Create index for scan history queries
CREATE INDEX idx_users_scan_history ON users USING GIN (scan_history);

-- Drop the separate scan_history table since we're using the users table
DROP TABLE IF EXISTS scan_history;
