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
        const selectedClass = document.getElementById("class-select")?.value;
        if (!selectedClass) {
          alert("Please select your class.");
          return;
        }
        updateData.class = selectedClass;
      }
      if (role === "teacher") {
        const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(el => el.value);
        if (selectedSubjects.length === 0) {
          alert("Please select at least one subject.");
          return;
        }
        updateData.subjects = selectedSubjects;
      }

      const { error } = await supabase.from("akun").upsert({
        id: session.user.id,
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

  async function toggleVisibility(element, show) {
    if (!element) return;
    element.style.display = show ? "" : "none";
    element.style.visibility = show ? "visible" : "hidden";
  }

  async function fetchUserData(session) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, phone, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
    return data;
  }

  async function fetchUserRole(session) {
    const { data, error } = await supabase
      .from("akun")
      .select("role")
      .eq("id", session.user.id);
    return error ? null : data;
  }

async function updateUserMenuDisplay() {
    const loggedInMenu = document.getElementById("logged-in-menu");
    const loggedOutMenu = document.getElementById("logged-out-menu");
    const mobileLoggedInMenu = document.getElementById("mobile-logged-in-menu");
    const mobileLoggedOutMenu = document.getElementById("mobile-logged-out-menu");
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const mobileUsernameElem = document.getElementById("mobile-username");
    const mobileRoleElem = document.getElementById("mobile-role");
    const mobileProfileImg = document.getElementById("mobile-profile-img");
  const mobileLogoutBtn = document.getElementById("mobile-log_out");

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = "index.html";
      } else {
        console.error("Logout error:", error);
      }
    });
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    loggedInMenu?.classList.remove('active');
    loggedOutMenu?.classList.add('active');
    mobileLoggedInMenu?.classList.remove('active');
    mobileLoggedOutMenu?.classList.add('active');
    return;
  }

    loggedInMenu?.classList.add('active');
    loggedOutMenu?.classList.remove('active');
    mobileLoggedInMenu?.classList.add('active');
    mobileLoggedOutMenu?.classList.remove('active');
    console.log("Session user:", session.user.email);

    const profile = await fetchUserData(session);
    if (profile && usernameElem) {
      usernameElem.textContent = profile.username || "User";
      if (mobileUsernameElem) mobileUsernameElem.textContent = profile.username || "User";

      const profileImg = document.getElementById("profile-img");
      const defaultUserIcon = document.querySelector(".default-user-icon");
      const loginBtn = document.getElementById("log_in");
      
      if (profileImg && profile.avatar_url) {
        // Fetch avatar_url from Supabase profile, then get public URL from storage
        let avatar_url = profile?.avatar_url || '';
        if (avatar_url && !avatar_url.startsWith('http')) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(avatar_url);
          avatar_url = data.publicUrl;
        }
        profileImg.src = avatar_url;
        profileImg.style.display = "block";
        if (defaultUserIcon) defaultUserIcon.style.display = "none";
      }
      if (mobileProfileImg && profile.avatar_url) {
        let avatar_url = profile?.avatar_url || '';
        if (avatar_url && !avatar_url.startsWith('http')) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(avatar_url);
          avatar_url = data.publicUrl;
        }
        mobileProfileImg.src = avatar_url;
        mobileProfileImg.style.display = "block";
        const mobileDefaultIcon = document.querySelector("#mobile-logged-in-menu .default-user-icon");
        if (mobileDefaultIcon) mobileDefaultIcon.style.display = "none";
      } else {
        const mobileDefaultIcon = document.querySelector("#mobile-logged-in-menu .default-user-icon");
        if (mobileDefaultIcon) mobileDefaultIcon.style.display = "inline-flex";
        if (mobileProfileImg) mobileProfileImg.style.display = "none";
      }

      // Show profile image and logged-in menu, hide logged-out menu and login button
      if (loginBtn) loginBtn.style.display = "none";
    } else {
      // Hide profile image and show logged-out menu and login button
      const profileImg = document.getElementById("profile-img");
      const defaultUserIcon = document.querySelector(".default-user-icon");
      const loginBtn = document.getElementById("log_in");
      const mobileProfileImg = document.getElementById("mobile-profile-img");
      const mobileUsernameElem = document.getElementById("mobile-username");

      if (profileImg) profileImg.style.display = "none";
      if (defaultUserIcon) defaultUserIcon.style.display = "block";
      if (mobileProfileImg) mobileProfileImg.style.display = "none";
      if (mobileUsernameElem) mobileUsernameElem.textContent = "Nama User";
      loggedInMenu?.classList.remove('active');
      loggedOutMenu?.classList.add('active');
      mobileLoggedInMenu?.classList.remove('active');
      mobileLoggedOutMenu?.classList.add('active');
      if (loginBtn) loginBtn.style.display = "block";
    }

    const roleData = await fetchUserRole(session);
    if (roleData && roleElem) {
      if (session.user.id === ADMIN_UID) {
        roleElem.innerHTML = '<span class="role-badge role-admin">Admin</span><button id="select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:none;">Select Role</button>';
        if (mobileRoleElem) mobileRoleElem.innerHTML = '<span class="role-badge role-admin">Admin</span><button id="mobile-select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:none;">Select Role</button>';
      } else if (roleData.length === 1 && roleData[0].role) {
        const role = roleData[0].role;
        const capitalized = role.charAt(0).toUpperCase() + role.slice(1);
        roleElem.innerHTML = `<span class="role-badge role-${role}">${capitalized}</span><button id="select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:none;">Select Role</button>`;
        if (mobileRoleElem) mobileRoleElem.innerHTML = `<span class="role-badge role-${role}">${capitalized}</span><button id="mobile-select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:none;">Select Role</button>`;
      } else {
        roleElem.innerHTML = '<span class="role-badge role-unset">No Role Assigned</span><button id="select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:inline-block;">Select Role</button>';
        if (mobileRoleElem) mobileRoleElem.innerHTML = '<span class="role-badge role-unset">No Role Assigned</span><button id="mobile-select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:inline-block;">Select Role</button>';
      }
    } else {
      // No role data, show only select role button without text
      roleElem.innerHTML = '<button id="select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:inline-block;">Select Role</button>';
      if (mobileRoleElem) mobileRoleElem.innerHTML = '<button id="mobile-select-role-btn" class="btn-select-role" aria-label="Select Role" type="button" style="display:inline-block;">Select Role</button>';
    }

    // Attach click event listener to select role button(s)
    const selectRoleBtn = document.getElementById("select-role-btn");
    if (selectRoleBtn) {
      selectRoleBtn.addEventListener("click", () => {
        const roleModal = document.getElementById("role-modal");
        const overlay = document.getElementById("overlay");
        if (roleModal && overlay) {
          roleModal.classList.add("open");
          roleModal.classList.remove("close");
          overlay.classList.add("open");
          overlay.classList.remove("close");
        }
      });
    }
    const mobileSelectRoleBtn = document.getElementById("mobile-select-role-btn");
    if (mobileSelectRoleBtn) {
      mobileSelectRoleBtn.addEventListener("click", () => {
        const roleModal = document.getElementById("role-modal");
        const overlay = document.getElementById("overlay");
        if (roleModal && overlay) {
          roleModal.classList.add("open");
          roleModal.classList.remove("close");
          overlay.classList.add("open");
          overlay.classList.remove("close");
        }
      });
    }

  // Show modal if username or phone missing
  if (profile && (!profile.username || !profile.phone)) {
    const userInfoModal = document.getElementById("user-info-modal");
    const overlay = document.getElementById("overlay");
    if (userInfoModal && overlay) {
      userInfoModal.classList.add("open");
      userInfoModal.classList.remove("close");
      overlay.classList.add("open");
      overlay.classList.remove("close");
    }
  }
  
  // Add event listener to close userInfoModal and overlay on clicking overlay
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      // Prevent immediate closing if click is inside modal content
      const userInfoModal = document.getElementById("user-info-modal");
      const roleModal = document.getElementById("role-modal");
      if (userInfoModal && userInfoModal.contains(event.target)) {
        return;
      }
      if (roleModal && roleModal.contains(event.target)) {
        return;
      }
      if (userInfoModal && userInfoModal.classList.contains("open")) {
        userInfoModal.classList.remove("open");
      }
      if (roleModal && roleModal.classList.contains("open")) {
        roleModal.classList.remove("open");
      }
      if (overlay.classList.contains("open")) {
        overlay.classList.remove("open");
      }
    });
  }

  // Toggle the mobile "More" menu
  function toggleMobileMoreMenu(event) {
    event.preventDefault();
    const menu = document.getElementById("mobile-more-menu");
    if (menu) {
      menu.classList.toggle("hidden");
    }
  }

  // Add event listener for the "more" button
  document.addEventListener("DOMContentLoaded", () => {
    const moreBtn = document.getElementById("mobile-nav-more");
    if (moreBtn) {
      moreBtn.onclick = function(event) {
        event.preventDefault();
        const menu = document.getElementById("mobile-more-menu");
        if (menu) menu.classList.toggle("hidden");
        moreBtn.blur();
      };
    }
  });

  // Hide "More" menu on outside click
  document.addEventListener("click", function (e) {
    const menu = document.getElementById("mobile-more-menu");
    const btn = document.getElementById("mobile-nav-more");

    if (menu && btn && !menu.classList.contains("hidden") &&
        !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });

  // Highlight active nav item for mobile navbar and sidebar
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

    // Highlight sidebar
    const sidebarId = sidebarMap[path];
    if (sidebarId) {
      const el = document.getElementById(sidebarId);
      el?.classList.add('active');
      el?.setAttribute('aria-current', 'page');
    }

    // Highlight mobile navbar
    const mobileId = mobileMap[path];
    if (mobileId) {
      const el = document.getElementById(mobileId);
      el?.classList.add('active');
      el?.setAttribute('aria-current', 'page');
    }
  }
}

// Example: Fetch sidebar.html and insert into #sidebar-container
checkAuth().then(user => {
  fetch('sidebar.html')
    .then(res => res.text())
    .then(async html => {
      document.getElementById('sidebar-container').innerHTML = html;
      // Only now, after HTML is injected, call initializeSidebar
      const { data: { session } } = await supabase.auth.getSession();
      window.initializeSidebar && window.initializeSidebar({
        isLoggedIn: !!session,
        session,
        username: session?.user?.user_metadata?.username || 'User',
        avatar_url: session?.user?.user_metadata?.avatar_url || '',
        role: ''
      });
      setupMobileNavbar(); // Attach "More" button event here
    });
});

window.initializeSidebar = async function(user) {
  // Hamburger toggle
  const sidebar = document.querySelector(".sidebar");
  const closeBtn = document.querySelector("#sidebar-toggle");
  if (sidebar && closeBtn) {
    closeBtn.onclick = () => {
      const isOpen = sidebar.classList.toggle("open");
      closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };
  }

  // Sidebar profile (desktop)
  const loggedInMenu = document.getElementById("logged-in-menu");
  const loggedOutMenu = document.getElementById("logged-out-menu");
  if (user && user.isLoggedIn) {
    // Optionally update user info in loggedInMenu here
    if (loggedInMenu) loggedInMenu.style.display = "";
    if (loggedOutMenu) loggedOutMenu.style.display = "none";
    // Example: update username, role, avatar
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const profileImg = document.getElementById("profile-img");
    if (usernameElem) usernameElem.textContent = user.username || "User";
    if (roleElem) roleElem.textContent = user.role || "";
    if (profileImg && user.avatar_url) profileImg.src = user.avatar_url;
  } else {
    if (loggedInMenu) loggedInMenu.style.display = "none";
    if (loggedOutMenu) loggedOutMenu.style.display = "";
  }

  // Logout
  const logoutBtn = document.getElementById("log_out");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // Role selection
  const selectRoleBtn = document.getElementById("select-role-btn");
  if (selectRoleBtn) {
    // Update select role button visibility and state based on user role
    const roleElem = document.getElementById("role");
    const roleBadge = roleElem ? roleElem.querySelector(".role-badge") : null;
    const hasRole = roleBadge && !roleBadge.classList.contains("role-unset");

    if (hasRole) {
      // User has a role, disable select role button
      selectRoleBtn.disabled = true;
      selectRoleBtn.style.opacity = "0.5";
      selectRoleBtn.style.cursor = "not-allowed";
    } else {
      // User has no role, enable select role button
      selectRoleBtn.disabled = false;
      selectRoleBtn.style.opacity = "1";
      selectRoleBtn.style.cursor = "pointer";

      selectRoleBtn.addEventListener("click", () => {
        const roleModal = document.getElementById("role-modal");
        const overlay = document.getElementById("overlay");
        if (roleModal && overlay) {
          roleModal.classList.add("open");
          roleModal.classList.remove("close");
          overlay.classList.add("open");
          overlay.classList.remove("close");
        }
      });
    }
  }

  // Highlight active nav
  highlightActiveNav();

  // Update user menu display based on session and profile
  updateUserMenuDisplay();

  updateSidebarMenus(user.isLoggedIn, user);
}

// Place highlightActiveNav outside so it's accessible
function highlightActiveNav() {
  // Remove 'active' and 'aria-current' from all sidebar and mobile nav items
  document.querySelectorAll('.sidebar .nav-list a.active, .mobile-bottom-navbar .active').forEach(el => {
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
    const liEl = document.getElementById(sidebarId);
    const aEl = liEl?.querySelector('a');
    aEl?.classList.add('active');
    aEl?.setAttribute('aria-current', 'page');
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
    const isOpen = moreMenu.classList.toggle("hidden") === false;
    moreBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      moreMenu.focus();
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      moreMenu && moreBtn &&
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

function updateSidebarMenus(isLoggedIn, userData) {
  // Sidebar
  const loggedInMenu = document.getElementById("logged-in-menu");
  const loggedOutMenu = document.getElementById("logged-out-menu");

  if (isLoggedIn) {
    if (loggedInMenu) loggedInMenu.style.display = "";
    if (loggedOutMenu) loggedOutMenu.style.display = "none";
    // Optionally update user info in loggedInMenu here
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
}}