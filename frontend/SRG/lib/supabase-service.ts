import { createClient } from '@supabase/supabase-js';

// Supabase service role client (bypasses RLS)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase service client: Missing environment variables');
  console.warn('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.warn('   EXPO_PUBLIC_SUPABASE_SERVICE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✅' : '❌');
}

// Create client with fallback to prevent crashes
export const supabaseService = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
  }
);
