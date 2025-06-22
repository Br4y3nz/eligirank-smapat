import supabase from '../Supabase/client.js';

// If you don't have real auth, use a dummy function for now:
function checkAuth() {
  return supabase.auth.getSession().then(({ data: { session } }) => {
    return { isLoggedIn: !!session, session };
  });
}

export function initializeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const closeBtn = document.querySelector("#sidebar-toggle");
  const loggedInMenu = document.getElementById("logged-in-menu");
  const loggedOutMenu = document.getElementById("logged-out-menu");
  const usernameElem = document.getElementById("username");
  const roleElem = document.getElementById("role");
  const logoutBtn = document.getElementById("log_out");
  const searchLink = document.querySelector("li.search-item > a.search-link");
  const searchInput = document.getElementById("search-input");
  const ADMIN_UID = "632455ea-c4e1-42f7-9955-b361dffa8e6d";

  if (!sidebar || !closeBtn) return;

  closeBtn.style.display = "";
  closeBtn.disabled = false;

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        localStorage.removeItem("rememberMe");
        window.location.href = "index.html";
      }
    });
  }

  // Add submit event listener for role form to save role data
  let roleForm = document.getElementById("role-form");
  if (roleForm) {
    roleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const role = document.querySelector('input[name="role"]:checked')?.value;
      if (!role) {
        alert("Please select a role.");
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        console.error("Session fetch failed:", sessionError);
        return;
      }

      const updateData = { role };

      if (role === "student") {
        updateData.nisn = document.getElementById("nisn")?.value.trim() || null;
        updateData.nis = document.getElementById("nis")?.value.trim() || null;
      } else if (role === "teacher") {
        updateData.nik = document.getElementById("nik")?.value.trim() || null;
        updateData.nuptk = document.getElementById("nuptk")?.value.trim() || null;
      }

      const { error } = await supabase.from("roles").upsert({
        user_id: session.user.id,
        ...updateData
      });

      if (!error) {
        alert("Role saved!");
        location.reload();
      } else {
        alert("Error saving role.");
        console.error(error);
      }
    });
  }

  // Add event listener to close modals on Escape key press
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const userInfoModal = document.getElementById("user-info-modal");
      const roleModal = document.getElementById("role-modal");
      const overlay = document.getElementById("overlay");

      if (userInfoModal && userInfoModal.classList.contains("open")) {
        userInfoModal.classList.remove("open");
        userInfoModal.classList.add("close");
      }
      if (roleModal && roleModal.classList.contains("open")) {
        roleModal.classList.remove("open");
        roleModal.classList.add("close");
      }
      if (overlay && overlay.classList.contains("open")) {
        overlay.classList.remove("open");
        overlay.classList.add("close");
      }
    }
  });
  

  closeBtn.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-closed', !isOpen);
    closeBtn.classList.toggle("bx-menu", !isOpen);
    closeBtn.classList.toggle("bx-menu-alt-right", isOpen);
    closeBtn.classList.add("btn-slide");
  });

  closeBtn.addEventListener("animationend", () => {
    closeBtn.classList.remove("btn-slide");
  });

  if (searchLink && searchInput) {
    searchLink.addEventListener("click", (e) => {
      if (!sidebar.classList.contains("open")) {
        e.preventDefault();
        sidebar.classList.add("open");
        closeBtn.setAttribute("aria-expanded", "true");
        setTimeout(() => searchInput.focus(), 300);
      }
    });
  }

  // Show/hide sidebar and mobile menus based on login state
  function updateSidebarMenus(isLoggedIn, userData) {
    // Sidebar
    const loggedInMenu = document.getElementById("logged-in-menu");
    const loggedOutMenu = document.getElementById("logged-out-menu");

    if (isLoggedIn) {
      if (loggedInMenu) loggedInMenu.style.display = "";
      if (loggedOutMenu) loggedOutMenu.style.display = "none";
      // Optionally update user info in loggedInMenu here
      if (userData && userData.username && usernameElem) {
        usernameElem.textContent = userData.username;
      }
      if (userData && userData.role && roleElem) {
        roleElem.textContent = userData.role;
      }
    } else {
      if (loggedInMenu) loggedInMenu.style.display = "none";
      if (loggedOutMenu) loggedOutMenu.style.display = "";
    }

    // Mobile
    const mobileLoggedInMenu = document.getElementById("mobile-logged-in-menu");
    const mobileLoggedOutMenu = document.getElementById("mobile-logged-out-menu");

    if (isLoggedIn) {
      if (mobileLoggedInMenu) mobileLoggedInMenu.style.display = "";
      if (mobileLoggedOutMenu) mobileLoggedOutMenu.style.display = "none";
      // Optionally update user info in mobileLoggedInMenu here
    } else {
      if (mobileLoggedInMenu) mobileLoggedInMenu.style.display = "none";
      if (mobileLoggedOutMenu) mobileLoggedOutMenu.style.display = "";
    }
  }

  // Highlight active nav
  highlightActiveNav();
}

// Place highlightActiveNav outside so it's accessible
function highlightActiveNav() {
  // Remove 'active' and 'aria-current' from all sidebar and mobile nav items
  document.querySelectorAll('.sidebar .nav-list .active, .mobile-bottom-navbar .active').forEach(el => {
    el.classList.remove('active');
    el.removeAttribute('aria-current');
  });

  let path = window.location.pathname.split('/').pop();
  if (!path || path === '') path = 'dashboard.html'; // fallback for root
  if (!path.includes('.')) path += '.html'; // handle clean URLs

  // Sidebar map
  const sidebarMap = {
    'dashboard.html': 'sidebar-nav-dashboard',
    'ranking.html': 'sidebar-nav-ranking',
    'prestasi.html': 'sidebar-nav-prestasi',
    'organisasi.html': 'sidebar-nav-organisasi',
    'akun.html': 'sidebar-nav-akun'
  };
  // Mobile navbar map
  const mobileMap = {
    'dashboard.html': 'mobile-nav-dashboard',
    'ranking.html': 'mobile-nav-ranking',
    'prestasi.html': 'mobile-nav-prestasi',
    'organisasi.html': 'mobile-nav-organisasi',
    'akun.html': 'mobile-nav-akun'
  };

  const sidebarId = sidebarMap[path];
  if (sidebarId) {
    const el = document.getElementById(sidebarId);
    el?.classList.add('active');
    el?.setAttribute('aria-current', 'page');
  }

  const mobileId = mobileMap[path];
  if (mobileId) {
    const el = document.getElementById(mobileId);
    el?.classList.add('active');
    el?.setAttribute('aria-current', 'page');
  }
}

// Setup mobile navbar "more" button toggle and outside click handling
function setupMobileNavbar() {
  const moreBtn = document.getElementById("mobile-nav-more");
  const moreMenu = document.getElementById("mobile-more-menu");

  if (!moreBtn || !moreMenu) return;

  // Toggle menu on button click
  moreBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const isOpen = !moreMenu.classList.toggle("hidden");
    moreBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      moreMenu.focus();
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !moreMenu.classList.contains("hidden") &&
      !moreMenu.contains(e.target) &&
      !moreBtn.contains(e.target)
    ) {
      moreMenu.classList.add("hidden");
      moreBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Optional: Close menu on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !moreMenu.classList.contains("hidden")) {
      moreMenu.classList.add("hidden");
      moreBtn.setAttribute("aria-expanded", "false");
      moreBtn.blur();
    }
  });
}

// Show/hide mobile login/logout in the more menu
function updateMobileMenus(isLoggedIn, userData) {
  const mobileLoggedInMenu = document.getElementById("mobile-logged-in-menu");
  const mobileLoggedOutMenu = document.getElementById("mobile-logged-out-menu");

  if (isLoggedIn) {
    if (mobileLoggedInMenu) mobileLoggedInMenu.style.display = "";
    if (mobileLoggedOutMenu) mobileLoggedOutMenu.style.display = "none";
    // Optionally update user info
    if (userData && userData.username) {
      document.getElementById("mobile-username").textContent = userData.username;
    }
    if (userData && userData.role) {
      document.getElementById("mobile-role").textContent = userData.role;
    }
    // Show profile image if available
    if (userData && userData.avatar_url) {
      const img = document.getElementById("mobile-profile-img");
      if (img) {
        img.src = userData.avatar_url;
        img.style.display = "block";
        img.previousElementSibling.style.display = "none"; // hide default icon
      }
    }
  } else {
    if (mobileLoggedInMenu) mobileLoggedInMenu.style.display = "none";
    if (mobileLoggedOutMenu) mobileLoggedOutMenu.style.display = "";
  }
}

// Example: Fetch sidebar.html and insert into #sidebar-container
checkAuth().then(user => {
  fetch('sidebar.html')
    .then(res => res.text())
    .then(async html => {
      document.getElementById('sidebar-container').innerHTML = html;
      const { data: { session } } = await supabase.auth.getSession();
      window.initializeSidebar && window.initializeSidebar({
        isLoggedIn: !!session,
        session,
        username: session?.user?.user_metadata?.username || 'User',
        avatar_url: session?.user?.user_metadata?.avatar_url || '',
        role: '' // isi dari tabel roles jika ada
      });
      // ADD THIS LINE:
      updateMobileMenus(!!session, {
        username: session?.user?.user_metadata?.username || 'User',
        avatar_url: session?.user?.user_metadata?.avatar_url || '',
        role: '' // isi dari tabel roles jika ada
      });
      setupMobileNavbar();
    });
});