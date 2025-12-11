// Supabase client initialization (diagnostic mode)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.87.1/+esm';

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';

console.log('[Supabase client] module loaded');

let supabase = null;

try {
  console.log('[Supabase client] creating client (url, anonKey prefix):', supabaseUrl, supabaseAnonKey?.slice(0,12) + '…');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, detectSessionInUrl: true }
  });
  // quick sanity check
  if (!supabase || !supabase.auth) {
    console.error('[Supabase client] createClient returned falsy or missing auth:', supabase);
  } else {
    console.log('[Supabase client] created successfully. auth keys:', Object.keys(supabase.auth).slice(0,6));
  }
} catch (err) {
  console.error('[Supabase client] ERROR while creating client:', err && (err.stack || err.message || err));
  // keep supabase as null
}

window.supabaseClient = supabase;

export default supabase;
export { supabase };

