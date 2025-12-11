// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.87.1/+esm';

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

window.supabaseClient = supabase;

export default supabase;
export { supabase };

