// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Use environment variables (Vite: import.meta.env.VITE_*, Node: process.env.*)
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.SUPABASE_URL) ||
  'https://yauwsxvgjmmyleheclpi.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY);

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing SUPABASE_ANON_KEY. Set VITE_SUPABASE_ANON_KEY (for Vite) or SUPABASE_ANON_KEY in your environment.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;

export default supabase;
