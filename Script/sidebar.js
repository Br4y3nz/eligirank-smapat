import supabase from '../Supabase/client.js';

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#btn");
    const loggedInMenu = document.getElementById("logged-in-menu");
    const loggedOutMenu = document.getElementById("logged-out-menu");
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const profileImg = document.getElementById("profile-img");
    const logoutBtn = document.getElementById("log_out");

const ADMIN_UID = "632455ea-c4e1-42f7-9955-b361dffa8e6d"; // Actual admin UID

    if (!sidebar || !closeBtn) {
        console.error("Sidebar or close button not found in DOM");
        return;
    }

    function updateUserMenuDisplay() {
        if (!loggedInMenu || !loggedOutMenu) {
            console.error("Logged in/out menu elements not found");
            return;
        }

        if (loggedInMenu.style.display === "none" || !loggedInMenu.style.display) {
            // User not logged in, show only login button
            loggedOutMenu.style.display = "block";
            loggedInMenu.style.display = "none";

            // Toggle "open" class on loggedOutMenu based on sidebar open state for CSS animation
            if (sidebar.classList.contains("open")) {
                loggedOutMenu.classList.add("open");
            } else {
                loggedOutMenu.classList.remove("open");
            }

            return;
        }

        if (sidebar.classList.contains("open")) {
            // Sidebar open: show username, role, and logout button
            if (usernameElem) usernameElem.style.display = "block";
            if (roleElem) roleElem.style.display = "block";
            if (profileImg) profileImg.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "inline-flex";
        } else {
            // Sidebar closed: show only profile image and logout button
            if (usernameElem) usernameElem.style.display = "none";
            if (roleElem) roleElem.style.display = "none";
            if (profileImg) profileImg.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "inline-flex";
        }
    }

closeBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    updateUserMenuDisplay();

    // Animate icon change with fade out/in for smooth transition
    closeBtn.style.transition = "opacity 0.3s ease";
    closeBtn.style.opacity = "0";

    setTimeout(() => {
        if (sidebar.classList.contains("open")) {
            closeBtn.classList.remove("bx-menu");
            closeBtn.classList.add("bx-menu-alt-right");
        } else {
            closeBtn.classList.remove("bx-menu-alt-right");
            closeBtn.classList.add("bx-menu");
        }
        closeBtn.style.opacity = "1";
    }, 300);
});

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
        const session = sessionData?.session;
        console.log('Session:', session);
        console.log('Logged-in menu element:', loggedInMenu);
        console.log('Logged-out menu element:', loggedOutMenu);

        if (session) {
            loggedInMenu.style.display = "flex";
            loggedOutMenu.style.display = "none";

            try {
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", session.user.id)
                    .single();

                if (profileError) {
                    console.error("Error fetching user data:", profileError);
                } else if (profileData) {
                    if (usernameElem) {
                        usernameElem.textContent = profileData.username || "User";
                        usernameElem.style.display = "block";
                    }
                    // Hide profile image if no avatar_url
                    if (profileImg) {
                        profileImg.style.display = "none";
                    }
                }

                // Fetch role from roles table
                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("role")
                    .eq("user_id", session.user.id);

                if (roleError) {
                    console.error("Error fetching role data:", roleError);
                    if (roleElem) {
                        roleElem.textContent = "Select role";
                        roleElem.style.cursor = "pointer";
                    }
                } else if (roleData && roleData.length === 1 && roleData[0].role) {
                    if (roleElem) {
                        roleElem.textContent = roleData[0].role;
                        roleElem.style.cursor = "default";
                    }
                } else {
                    if (roleElem) {
                        roleElem.textContent = "Select role";
                        roleElem.style.cursor = "pointer";
                    }
                }
            } catch (error) {
                console.error("Error fetching user or role data:", error);
            }

            updateUserMenuDisplay();
        } else {
            loggedInMenu.style.display = "none";
            loggedOutMenu.style.display = "block";
            updateUserMenuDisplay();
        }
    });

    logoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        } else {
            localStorage.removeItem('rememberMe');
            window.location.reload();
        }
    });

    // Add auth state change listener to handle session expiration and sign out
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED' || event === 'USER_DELETED') {
            localStorage.removeItem('rememberMe');
            alert('Your session has expired or you have been signed out. Please log in again.');
            window.location.href = '/register.html';
        }
    });

    // Role modal logic
    const roleModal = document.getElementById("role-modal");
    const overlay = document.getElementById("overlay");
    const roleForm = document.getElementById("role-form");
    const roleTextElem = roleElem;
    const closeModalBtn = document.getElementById("close-role-modal");
    const studentFields = document.getElementById("student-fields");
    const teacherFields = document.getElementById("teacher-fields");

    function openRoleModal() {
        roleModal.style.display = "block";
        overlay.style.display = "block";
    }

    function closeRoleModal() {
        roleModal.style.display = "none";
        overlay.style.display = "none";
    }

    if (roleTextElem) {
        console.log("Attaching click event to role element");
        roleTextElem.addEventListener("click", () => {
            console.log("Role element clicked");
            if (roleTextElem.textContent === "Select role") {
                openRoleModal();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeRoleModal);
    }

    overlay.addEventListener("click", closeRoleModal);

    roleForm.addEventListener("change", (event) => {
        const selectedRole = roleForm.role.value;
        if (selectedRole === "student") {
            studentFields.style.display = "block";
            teacherFields.style.display = "none";
        } else if (selectedRole === "teacher") {
            studentFields.style.display = "none";
            teacherFields.style.display = "block";
        }
    });

    roleForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(roleForm);
        const role = formData.get("role");
        const nisn = formData.get("nisn");
        const nis = formData.get("nis");
        const nik = formData.get("nik");
        const nuptk = formData.get("nuptk");

        try {
            const session = supabase.auth.getSession().then(({ data: sessionData }) => sessionData?.session);
            if (!session) {
                alert("You must be logged in to set a role.");
                return;
            }
            const userId = (await session).user.id;

            // Insert or update role in roles table
            const { error } = await supabase
                .from("roles")
                .upsert({
                    user_id: userId,
                    role: role,
                    nisn: role === "student" ? nisn : null,
                    nis: role === "student" ? nis : null,
                    nik: role === "teacher" ? nik : null,
                    nuptk: role === "teacher" ? nuptk : null,
                }, { onConflict: "user_id" });

            if (error) {
                console.error("Error saving role:", error);
                alert("Failed to save role. Please try again.");
                return;
            }

            roleTextElem.textContent = role;
            roleTextElem.style.cursor = "default";
            closeRoleModal();
        } catch (error) {
            console.error("Error during role save:", error);
            alert("An error occurred. Please try again.");
        }
    });
});


function expandSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
    }
}

// Add event listener to search icon button after DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    const searchIconBtn = document.getElementById('search-icon');
    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', () => {
            expandSidebar();
            // Optionally, focus the search input after expanding
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        });
    }

    // Prevent navigation on clicking the search link anchor
    const searchLink = document.querySelector('a.search-link');
    if (searchLink) {
        searchLink.addEventListener('click', (event) => {
            event.preventDefault();
            // Expand sidebar and focus search input
            expandSidebar();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        });
    }
});
