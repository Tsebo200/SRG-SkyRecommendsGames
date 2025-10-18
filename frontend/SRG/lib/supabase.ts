import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file contains:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n' +
    'Then restart Expo with: npm start -c'
  );
}

console.log('🔍 Supabase configuration:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  keyLength: SUPABASE_ANON_KEY?.length
});

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



