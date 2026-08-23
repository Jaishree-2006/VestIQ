import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.');
}

export const supabase = createClient(
  supabaseUrl || 'https://lacrkmmarfhpfvsojvme.supabase.co',
  supabaseAnonKey || 'sb_publishable_lV3JLgkY3yof3cStwFvaRQ_9vqqbdEx',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
