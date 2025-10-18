import { createClient } from '@supabase/supabase-js';

// Supabase service role client (bypasses RLS)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
