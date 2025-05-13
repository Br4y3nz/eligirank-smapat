import supabase from '../supabase/client.js';

export function initializeSidebar() {
    console.log("initializeSidebar called");
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#sidebar-toggle");
    const loggedInMenu = document.getElementById("logged-in-menu");
    // Duplicate declaration removed
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const logoutBtn = document.getElementById("log_out");
    const searchLink = document.querySelector("li.search-item > a.search-link");
    const searchInput = document.getElementById("search-input");
    const ADMIN_UID = "632455ea-c4e1-42f7-9955-b361dffa8e6d";

    if (!sidebar || !closeBtn) {
        console.error("Sidebar or close button not found in DOM");
        return;
    }

    const loggedOutMenu = document.getElementById("logged-out-menu");
    const loginLink = document.getElementById("log_in");

    if (loginLink) {
        loginLink.addEventListener("click", (e) => {
            e.preventDefault();
            // Implement your login logic here, e.g., show login modal or redirect
            console.log("Login link clicked");
            // Example: redirect to login page
            window.location.href = "index.html";
        });
    }

    function toggleVisibility(element, show) {
        if (!element) return;
        element.style.display = show ? "" : "none";
    }

    async function fetchUserData(session) {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("username, phone")
                .eq("id", session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("Error fetching user data:", profileError);
                return null;
            }
            return profileData;
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    }

    async function fetchUserRole(session) {
        try {
            const { data: roleData, error: roleError } = await supabase
                .from("roles")
                .select("role")
                .eq("user_id", session.user.id);

            if (roleError) {
                console.error("Error fetching role data:", roleError);
                return null;
            }
            return roleData;
        } catch (error) {
            console.error("Error fetching role data:", error);
            return null;
        }
    }

    async function updateUserMenuDisplay() {
        if (!loggedInMenu || !loggedOutMenu) {
            console.error("Logged in/out menu elements not found");
            return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session) {
            toggleVisibility(loggedInMenu, true);
            toggleVisibility(loggedOutMenu, false);

            if (usernameElem) {
                usernameElem.textContent = "Loading...";
            }
            if (roleElem) {
                roleElem.textContent = "";
            }
            if (logoutBtn) {
                logoutBtn.style.display = "";
            }

            const profileData = await fetchUserData(session);
            if (profileData && usernameElem) {
                usernameElem.textContent = profileData.username || "User";
            }

            const roleData = await fetchUserRole(session);
            if (roleData && roleElem) {
                if (session.user.id === ADMIN_UID) {
                    roleElem.innerHTML = '<span class="role-badge role-admin">Admin</span>';
                    roleElem.style.cursor = "default";
                } else if (roleData.length === 1 && roleData[0].role) {
                    const roleText = roleData[0].role;
                    const capitalizedRole = roleText.charAt(0).toUpperCase() + roleText.slice(1).toLowerCase();
                    roleElem.innerHTML = `<span class="role-badge">${capitalizedRole}</span>`;
                } else {
                    roleElem.innerHTML = '<span class="role-badge">Select role</span>';
                    roleElem.style.cursor = "pointer";
                }
            }
        } else {
            toggleVisibility(loggedInMenu, false);
            toggleVisibility(loggedOutMenu, true);
            if (logoutBtn) {
                logoutBtn.style.display = "none";
            }
        }
    }

    closeBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        updateUserMenuDisplay();

        closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

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

            if (isOpen) {
                closeBtn.classList.add("btn-slide");
            }
        }, 300);
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
                updateUserMenuDisplay();
                setTimeout(() => {
                    searchInput.focus();
                }, 300);
            }
        });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
        updateUserMenuDisplay();
    });

    // Listen to auth state changes to update menu display accordingly
    supabase.auth.onAuthStateChange((_event, session) => {
        updateUserMenuDisplay();
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error);
            } else {
                localStorage.removeItem("rememberMe");
                window.location.href = "index.html";
            }
        });
    } else {
        console.warn("Logout button not found");
    }
}
