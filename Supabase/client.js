var supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
var supabaseKey = 'your-key-here';

function initSupabase() {
  if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  } else {
    setTimeout(initSupabase, 50);
  }
}

initSupabase();
