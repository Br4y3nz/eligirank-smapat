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
    if (sidebarContainer) {
      sidebarContainer.classList.toggle("open", isOpen);
    }
    closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-closed', !isOpen);
    closeBtn.classList.toggle("bx-menu", !isOpen);
    closeBtn.classList.toggle("bx-menu-alt-right", isOpen);
    closeBtn.classList.add("btn-slide");
  });

  // Keyboard accessibility for toggle button
  closeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      closeBtn.click();
    }
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
      .from("roles")
      .select("role")
      .eq("user_id", session.user.id);
    return error ? null : data;
  }

  async function updateUserMenuDisplay() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      toggleVisibility(loggedInMenu, false);
      toggleVisibility(loggedOutMenu, true);
      return;
    }

    toggleVisibility(loggedInMenu, true);
    toggleVisibility(loggedOutMenu, false);
    console.log("Session user:", session.user.email);

    const profile = await fetchUserData(session);
    if (profile && usernameElem) {
      usernameElem.textContent = profile.username || "User";

      const profileImg = document.getElementById("profile-img");
      const defaultUserIcon = document.querySelector(".default-user-icon");
      const loggedInMenu = document.getElementById("logged-in-menu");
      const loggedOutMenu = document.getElementById("logged-out-menu");
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

      // Show profile image and logged-in menu, hide logged-out menu and login button
      if (loggedInMenu) loggedInMenu.style.display = "block";
      if (loggedOutMenu) loggedOutMenu.style.display = "none";
      if (loginBtn) loginBtn.style.display = "none";
    } else {
      // Hide profile image and show logged-out menu and login button
      const profileImg = document.getElementById("profile-img");
      const defaultUserIcon = document.querySelector(".default-user-icon");
      const loggedInMenu = document.getElementById("logged-in-menu");
      const loggedOutMenu = document.getElementById("logged-out-menu");
      const loginBtn = document.getElementById("log_in");

      if (profileImg) profileImg.style.display = "none";
      if (defaultUserIcon) defaultUserIcon.style.display = "block";
      if (loggedInMenu) loggedInMenu.style.display = "none";
      if (loggedOutMenu) loggedOutMenu.style.display = "block";
      if (loginBtn) loginBtn.style.display = "block";
    }

    const roleData = await fetchUserRole(session);
    if (roleData && roleElem) {
      if (session.user.id === ADMIN_UID) {
        roleElem.innerHTML = '<span class="role-badge role-admin">Admin</span>';
      } else if (roleData.length === 1 && roleData[0].role) {
        const role = roleData[0].role;
        const capitalized = role.charAt(0).toUpperCase() + role.slice(1);
        roleElem.innerHTML = `<span class="role-badge role-${role}">${capitalized}</span>`;
      } else {
        roleElem.innerHTML = '<span class="role-badge role-unset">Select Role</span>';
      }
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

  // Tutup menu jika klik di luar
  document.addEventListener("click", function (e) {
    const menu = document.getElementById("mobile-more-menu");
    const btn = document.getElementById("mobile-nav-other");

    if (menu && !menu.classList.contains("hidden") &&
        !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });

  // Highlight active nav item for mobile navbar and sidebar
  function highlightActiveNav() {
    let path = window.location.pathname.split('/').pop();
    if (!path || path === '') path = 'dashboard.html';
    if (!path.includes('.')) path += '.html';

    const sidebarMap = {
      'dashboard.html': 'sidebar-nav-dashboard',
      'ranking.html': 'sidebar-nav-ranking',
      'prestasi.html': 'sidebar-nav-prestasi',
      'organisasi.html': 'sidebar-nav-organisasi',
      'data-siswa.html': 'sidebar-nav-data-siswa',
      'guru-staff.html': 'sidebar-nav-guru-staff',
      'akun.html': 'sidebar-nav-akun'
    };
    const mobileMap = {
      'dashboard.html': 'mobile-nav-dashboard',
      'ranking.html': 'mobile-nav-ranking',
      'prestasi.html': 'mobile-nav-prestasi',
      'akun.html': 'mobile-nav-akun'
    };

    // Sidebar
    const sidebarId = sidebarMap[path];
    if (sidebarId) {
      const el = document.getElementById(sidebarId);
      el?.classList.add('active');
      el?.setAttribute('aria-current', 'page');
    }
    // Mobile navbar
    const mobileId = mobileMap[path];
    if (mobileId) {
      const el = document.getElementById(mobileId);
      el?.classList.add('active');
      el?.setAttribute('aria-current', 'page');
    }
  }

  // Call this after you insert the fetched HTML:
  highlightActiveNav();
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
  const profileContainer = document.getElementById("sidebar-profile-container");
  if (user && user.isLoggedIn) {
    const { username = 'User', avatar_url = '', role: userRole = '' } = user || {};
    const roleData = await fetchUserRole(user.session);
    const role = roleData?.role || "";
    const roleBadge = role
      ? `<span class="role-badge role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
      : `<button class="role-badge role-unset" id="select-role-btn">Select Role</button>`;

    document.getElementById('sidebar-profile-container').innerHTML = `
      <div class="profile-picture">
        <img id="profile-img" src="${avatar_url}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
        <i class="bx bx-user default-user-icon" style="display:${avatar_url ? 'none' : 'block'}"></i>
      </div>
      <div class="profile-details">
        <span class="name" id="username">${username}</span>
        <span class="job" id="role">${role || ""}</span>
        ${roleBadge}
      </div>
      <button id="log_out" title="Logout"><i class="bx bx-log-out"></i></button>
    `;
    document.getElementById('sidebar-login-container').innerHTML = '';

    // Mobile
    const mobileProfileContainer = document.getElementById("mobile-profile-container");
    const mobileLoginBtn = document.getElementById("log_in_mobile");
    if (mobileProfileContainer) {
      mobileProfileContainer.style.display = "flex";
      mobileProfileContainer.innerHTML = `
        <div class="profile-picture">
          <img id="mobile-profile-img" src="${avatar_url}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <i class="bx bx-user default-user-icon" style="display:${avatar_url ? 'none' : 'block'}"></i>
        </div>
        <div class="profile-details">
          <span class="name" id="mobile-username">${username}</span>
          <span class="job" id="mobile-role">${role || ""}</span>
          ${roleBadge.replace('select-role-btn', 'mobile-select-role-btn')}
        </div>
        <button id="mobile-log_out" title="Logout"><i class="bx bx-log-out"></i></button>
      `;
      if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
    }
  } else {
    // Desktop
    document.getElementById('sidebar-profile-container').innerHTML = '';
    document.getElementById('sidebar-login-container').innerHTML = `
      <a href="login.html" class="nav-link">
        <i class="bx bx-log-in"></i>
        <span class="link-text">Login</span>
      </a>
    `;
    // Mobile
    const mobileProfileContainer = document.getElementById("mobile-profile-container");
    const mobileLoginBtn = document.getElementById("log_in_mobile");
    if (mobileProfileContainer) mobileProfileContainer.style.display = "none";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "flex";
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
    selectRoleBtn.onclick = () => {
      // Show your role selection modal here
      alert("Show role selection modal here!");
    };
  }

  // Mobile profile
  const mobileProfileContainer = document.getElementById("mobile-profile-container");
  const mobileLoginBtn = document.getElementById("log_in_mobile");
  if (mobileProfileContainer) {
    mobileProfileContainer.style.display = "flex";
    mobileProfileContainer.innerHTML = `
      <div class="profile-picture">
        <img id="mobile-profile-img" src="${user.avatar_url}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" style="display:${user.avatar_url ? 'block' : 'none'};">
        <i class="bx bx-user default-user-icon" style="display:${user.avatar_url ? 'none' : 'block'}"></i>
      </div>
      <div class="profile-details">
        <span class="name" id="mobile-username">${user.username}</span>
        <span class="job" id="mobile-role">${user.role || ""}</span>
        ${roleBadge.replace('select-role-btn', 'mobile-select-role-btn')}
      </div>
      <button id="mobile-log_out" title="Logout"><i class="bx bx-log-out"></i></button>
    `;
    // Mobile logout
    const mobileLogoutBtn = document.getElementById("mobile-log_out");
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "index.html";
      });
    }
    // Mobile role selection
    const mobileSelectRoleBtn = document.getElementById("mobile-select-role-btn");
    if (mobileSelectRoleBtn) {
      mobileSelectRoleBtn.onclick = () => {
        alert("Show role selection modal here!");
      };
    }
    if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
  } else if (loggedOutMenu) {
    loggedInMenu.style.display = "none";
    loggedOutMenu.style.display = "flex";
    if (mobileProfileContainer) mobileProfileContainer.style.display = "none";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "flex";
  }

  highlightActiveNav();
};

// Example: Call this after fetching sidebar/mobile navbar HTML
function renderMenus(user) {
  // Sidebar
  if (user && user.isLoggedIn) {
    const role = user.role || '';
    const roleBadge = role
      ? `<span class="role-badge role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
      : `<button class="role-badge role-unset" id="select-role-btn">Select Role</button>`;
    document.getElementById('sidebar-profile-container').innerHTML = `
      <div class="profile-picture">
        <img id="profile-img" src="${user.avatar_url || ''}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
        <i class="bx bx-user default-user-icon" style="display:${user.avatar_url ? 'none' : 'block'}"></i>
      </div>
      <div class="profile-details">
        <span class="name" id="username">${user.username || 'User'}</span>
        <span class="job" id="role">${role || ""}</span>
        ${roleBadge}
      </div>
      <button id="log_out" title="Logout"><i class="bx bx-log-out"></i></button>
    `;
    document.getElementById('sidebar-login-container').innerHTML = '';
  } else {
    document.getElementById('sidebar-profile-container').innerHTML = '';
    document.getElementById('sidebar-login-container').innerHTML = `
      <a href="login.html" class="nav-link">
        <i class="bx bx-log-in"></i>
        <span class="link-text">Login</span>
      </a>
    `;
  }

  // Mobile
  const mobileProfileContainer = document.getElementById("mobile-profile-container");
  const mobileLoginBtn = document.getElementById("log_in_mobile");
  if (user && user.isLoggedIn) {
    const role = user.role || '';
    const roleBadge = role
      ? `<span class="role-badge role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
      : `<button class="role-badge role-unset" id="mobile-select-role-btn">Select Role</button>`;
    if (mobileProfileContainer) {
      mobileProfileContainer.style.display = "flex";
      mobileProfileContainer.innerHTML = `
        <div class="profile-picture">
          <img id="mobile-profile-img" src="${user.avatar_url || ''}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <i class="bx bx-user default-user-icon" style="display:${user.avatar_url ? 'none' : 'block'}"></i>
        </div>
        <div class="profile-details">
          <span class="name" id="mobile-username">${user.username || 'User'}</span>
          <span class="job" id="mobile-role">${role || ""}</span>
          ${roleBadge}
        </div>
        <button id="mobile-log_out" title="Logout"><i class="bx bx-log-out"></i></button>
      `;
      if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
    }
  } else {
    if (mobileProfileContainer) mobileProfileContainer.style.display = "none";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "flex";
  }
}

// Example usage after fetching HTML and user session:
renderMenus({
  isLoggedIn: true,
  username: "Brayen",
  avatar_url: "https://your-supabase-url/storage/v1/object/public/avatars/yourimg.jpg",
  role: "student"
});

document.addEventListener('DOMContentLoaded', function() {
  // Sidebar logout
  const logoutBtn = document.getElementById('log_out');
  if (logoutBtn) {
    logoutBtn.onclick = async function() {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    };
  }
  // Mobile logout (bottom sheet)
  const mobileLogoutBtn = document.getElementById('mobile-log_out');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.onclick = async function() {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    };
  }
});

function renderMobileMenu(user) {
  const mobileProfileContainer = document.getElementById("mobile-profile-container");
  const mobileLoginBtn = document.getElementById("mobile-log_in");
  if (user && user.isLoggedIn) {
    const role = user.role || '';
    const roleBadge = role
      ? `<span class="role-badge role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
      : `<button class="role-badge role-unset" id="mobile-select-role-btn">Select Role</button>`;
    if (mobileProfileContainer) {
      mobileProfileContainer.style.display = "flex";
      mobileProfileContainer.innerHTML = `
        <div class="profile-picture">
          <img id="mobile-profile-img" src="${user.avatar_url || ''}" alt="Profile" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <i class="bx bx-user default-user-icon" style="display:${user.avatar_url ? 'none' : 'block'}"></i>
        </div>
        <div class="profile-details">
          <span class="name" id="mobile-username">${user.username || 'User'}</span>
          <span class="job" id="mobile-role">${role || ""}</span>
          ${roleBadge}
        </div>
        <button id="mobile-log_out" title="Logout"><i class="bx bx-log-out"></i></button>
      `;
      if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
      // Add logout event
      const mobileLogoutBtn = document.getElementById("mobile-log_out");
      if (mobileLogoutBtn) {
        mobileLogoutBtn.onclick = async function() {
          await supabase.auth.signOut();
          window.location.href = "index.html";
        };
      }
    }
  } else {
    if (mobileProfileContainer) mobileProfileContainer.style.display = "none";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "flex";
  }
}}