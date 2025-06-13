import supabase from '../Supabase/client.js';

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
        alert("You're not logged in.");
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
}
  

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

      if (profileImg && profile.avatar_url) {
        if (profile.avatar_url.startsWith("http")) {
          profileImg.src = profile.avatar_url;
        } else {
          const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
          profileImg.src = data.publicUrl;
        }
        profileImg.style.display = "block";
        if (defaultUserIcon) defaultUserIcon.style.display = "none";
      }
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
    if (!profile.username || !profile.phone) {
      const userInfoModal = document.getElementById("user-info-modal");
      const overlay = document.getElementById("overlay");
      if (userInfoModal && overlay) {
        userInfoModal.style.display = "block";
        overlay.style.display = "block";
      }
    }

    // Highlight active menu item based on current page URL
    const currentPath = window.location.pathname.split("/").pop();
    const menuLinks = document.querySelectorAll("#sidebar-menu li a");
    menuLinks.forEach(link => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  updateUserMenuDisplay();

  // Add submit event listener for user-info form to save profile data without page reload
  const userInfoForm = document.getElementById("user-info-form");
  if (userInfoForm) {
    userInfoForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username-input").value.trim();
      const phone = document.getElementById("phone-input").value.trim();

      if (!username || !phone) {
        alert("Please fill in both username and phone number.");
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        console.error("Session fetch failed:", sessionError);
        alert("You're not logged in.");
        return;
      }

      const userId = session.user.id;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          username,
          phone
        });

      if (error) {
        console.error("Supabase error during upsert:", error);
        alert("Failed to save profile. Please try again.");
        return;
      }

      alert("Profile updated successfully!");
      const userInfoModal = document.getElementById("user-info-modal");
      const overlay = document.getElementById("overlay");
      if (userInfoModal && overlay) {
        userInfoModal.style.display = "none";
        overlay.style.display = "none";
      }

      // Update sidebar user info display without page reload
      updateUserMenuDisplay();
    });
  }

  // Add click event to roleElem to open role modal if "Select Role"
  if (roleElem) {
    roleElem.style.cursor = "pointer"; // Ensure cursor indicates clickable
    roleElem.addEventListener("click", () => {
      if (roleElem.textContent.trim() === "Select Role") {
        const roleModal = document.getElementById("role-modal");
        const overlay = document.getElementById("overlay");
        if (roleModal && overlay) {
          roleModal.style.display = "block";
          overlay.style.display = "block";
        }
      }
    });
  }

  // Add change event listeners to role radio inputs to show/hide student/teacher fields
  const roleInputs = document.querySelectorAll('input[name="role"]');
  roleInputs.forEach(input => {
    input.addEventListener("change", () => {
      const studentFields = document.getElementById("student-fields");
      const teacherFields = document.getElementById("teacher-fields");
      if (studentFields && teacherFields) {
        studentFields.style.display = input.value === "student" ? "block" : "none";
        teacherFields.style.display = input.value === "teacher" ? "block" : "none";
      }
    });
  });

