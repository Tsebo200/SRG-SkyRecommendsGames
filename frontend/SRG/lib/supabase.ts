import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing to prevent crashes
// The app will still work, but Supabase features won't function
let supabaseClient: ReturnType<typeof createClient>;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing Supabase environment variables. Supabase features will be disabled.');
  console.warn('   Please check your .env file contains:');
  console.warn('   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  
  // Create a dummy client with placeholder values to prevent crashes
  // This allows the app to start even without Supabase configured
  supabaseClient = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
} else {
  console.log('🔍 Supabase configuration:', {
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
    keyLength: SUPABASE_ANON_KEY?.length
  });
  
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = supabaseClient;



