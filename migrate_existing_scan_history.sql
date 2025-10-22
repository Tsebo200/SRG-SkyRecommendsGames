-- Safe migration for existing scan_history setup
-- This handles the case where scan_history table already exists

-- First, let's check if scan_history table exists and what structure it has
-- If it exists but has wrong structure, we'll fix it
-- If it doesn't exist, we'll create it

-- Step 1: Check if scan_history table exists and get its structure
DO $$
BEGIN
    -- Check if scan_history table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_history' AND table_schema = 'public') THEN
        RAISE NOTICE 'scan_history table already exists';
        
        -- Check if it has the right structure
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_history' AND column_name = 'user_id') THEN
            RAISE NOTICE 'scan_history table exists but needs user_id column';
            -- Add user_id column if missing
            ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS user_id UUID;
        END IF;
        
        -- Check if it has proper foreign key
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%user_id%' 
            AND table_name = 'scan_history'
        ) THEN
            RAISE NOTICE 'Adding foreign key constraint to users table';
            -- Add foreign key constraint
            ALTER TABLE scan_history 
            ADD CONSTRAINT scan_history_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
    ELSE
        RAISE NOTICE 'scan_history table does not exist, creating it';
        -- Create the table if it doesn't exist
        CREATE TABLE scan_history (
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
    END IF;
END $$;

-- Step 2: Migrate data from users.scan_history JSONB to scan_history table
-- Only if users.scan_history has data
DO $$
DECLARE
    user_record RECORD;
    scan_item JSONB;
    scan_count INTEGER := 0;
BEGIN
    -- Loop through users who have scan_history data
    FOR user_record IN 
        SELECT id, scan_history 
        FROM users 
        WHERE scan_history IS NOT NULL 
        AND jsonb_array_length(scan_history) > 0
    LOOP
        RAISE NOTICE 'Migrating scans for user %', user_record.id;
        
        -- Loop through each scan in the JSONB array
        FOR scan_item IN SELECT * FROM jsonb_array_elements(user_record.scan_history)
        LOOP
            -- Insert into scan_history table
            INSERT INTO scan_history (
                user_id,
                scan_type,
                scan_data,
                scan_date,
                source,
                game_name,
                game_id,
                platform,
                cover_art,
                created_at
            ) VALUES (
                user_record.id,
                COALESCE(scan_item->>'scan_type', 'qr_code'),
                scan_item->'scan_data',
                COALESCE(
                    (scan_item->>'scan_date')::timestamp with time zone,
                    (scan_item->>'created_at')::timestamp with time zone,
                    NOW()
                ),
                COALESCE(scan_item->>'source', 'QR Code'),
                scan_item->>'game_name',
                scan_item->>'game_id',
                scan_item->>'platform',
                scan_item->>'cover_art',
                COALESCE(
                    (scan_item->>'created_at')::timestamp with time zone,
                    NOW()
                )
            );
            
            scan_count := scan_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migrated % scan records', scan_count;
END $$;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_date ON scan_history(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_game_id ON scan_history(game_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_type ON scan_history(scan_type);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_data ON scan_history USING GIN (scan_data);

-- Step 4: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_scan_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scan_history_updated_at ON scan_history;
CREATE TRIGGER trigger_update_scan_history_updated_at
    BEFORE UPDATE ON scan_history
    FOR EACH ROW
    EXECUTE FUNCTION update_scan_history_updated_at();

-- Step 5: Disable RLS (since we use Firebase auth)
ALTER TABLE scan_history DISABLE ROW LEVEL SECURITY;

-- Step 6: Remove old scan_history column from users table
-- Only after confirming data migration worked
-- ALTER TABLE users DROP COLUMN IF EXISTS scan_history;

-- Step 7: Verify migration
SELECT 
    'Migration Summary' as status,
    (SELECT COUNT(*) FROM scan_history) as total_scans,
    (SELECT COUNT(DISTINCT user_id) FROM scan_history) as users_with_scans,
    (SELECT COUNT(*) FROM users WHERE scan_history IS NOT NULL AND jsonb_array_length(scan_history) > 0) as users_with_old_data;
