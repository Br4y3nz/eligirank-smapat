// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

import { createClient } from '@supabase/supabase-js';

// Replace 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY' with your actual project credentials
const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

