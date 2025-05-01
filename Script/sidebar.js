import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://yauwsxvgjmmyleheclpi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY";

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  let sidebar = document.querySelector(".sidebar");
  let closeBtn = document.querySelector("#btn");
  let searchBtn = document.querySelector(".bx-search");
  let overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.classList.add("overlay");
  document.body.appendChild(overlay);
  if (document.getElementById('overlay')) {
    document.getElementById('overlay').style.display = 'none';
}

  supabase.auth.getSession().then((session) => {
    if (session && session.data.session) {
      // User is logged in, show logged-in-menu
      document.getElementById('logged-in-menu').style.display = 'block';
      document.getElementById('logged-out-menu').style.display = 'none';
    } else {
      // User is logged out, show logged-out-menu
      document.getElementById('logged-in-menu').style.display = 'none';
      document.getElementById('logged-out-menu').style.display = 'block';
    }
    if (overlay) {
      overlay.style.display = "none";
    }
  });

  async function fetchUsername() {
    const { data, error } = await supabaseClient.from('users').select('username').limit(1);
    if (error) {
      console.error('Error fetching username:', error);
    } else if (data && data.length > 0) {
      usernameElement.innerHTML = data[0].username;
    }
  }

  function toggleSidebar() {
    sidebar.classList.toggle("open");
    menuBtnChange();
    if (sidebar.classList.contains("open")) {
      overlay.style.display = "block";
    } else {
      overlay.style.display = "none";
    }
  }

  closeBtn.addEventListener("click", toggleSidebar);
  searchBtn.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);

  function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
      closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
      closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
  }

  menuBtnChange();
  overlay.style.display = "none";
});