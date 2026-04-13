import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'sb_publishable_NeBA2E8tPjofALKQ2iExdA_9073jYb-',
  {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
    },
  }
);
