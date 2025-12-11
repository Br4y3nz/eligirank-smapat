// Supabase client initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseKey = 'sb_publishable_vaduWdniIYxzUJMnyxBjGg_Wkrsn_OP';

const supabase = createClient(supabaseUrl, supabaseKey);

window.supabaseClient = supabase;

export default supabase;

