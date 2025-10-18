import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please create frontend/SRG/.env with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH\n' +
    'Then restart Expo with: npm start -c'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



