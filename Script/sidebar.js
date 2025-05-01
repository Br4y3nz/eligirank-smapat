document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#btn");
    const loggedInMenu = document.getElementById("logged-in-menu");
    const loggedOutMenu = document.getElementById("logged-out-menu");
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const profileImg = document.getElementById("profile-img");
    const logoutBtn = document.getElementById("log_out");

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
            return;
        }

        if (sidebar.classList.contains("open")) {
            // Sidebar open: show username, role, and logout button
            if (usernameElem) usernameElem.style.display = "block";
            if (roleElem) roleElem.style.display = "block";
            if (profileImg) profileImg.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "inline-flex";
        } else {
            // Sidebar closed: show only logout button
            if (usernameElem) usernameElem.style.display = "none";
            if (roleElem) roleElem.style.display = "none";
            if (profileImg) profileImg.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "inline-flex";
        }
    }

    closeBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        updateUserMenuDisplay();
    });

    if (!window.supabaseClient) {
        console.error("Supabase client not found on window");
        return;
    }

    window.supabaseClient.auth.getSession().then(({ data: sessionData }) => {
        const session = sessionData?.session;
        console.log('Session:', session);
        console.log('Logged-in menu element:', loggedInMenu);
        console.log('Logged-out menu element:', loggedOutMenu);

        if (session) {
            loggedInMenu.style.display = "flex";
            loggedOutMenu.style.display = "none";

            window.supabaseClient
                .from("profiles")
                .select("username, role, avatar_url")
                .eq("id", session.user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Error fetching user data:", error);
                        return;
                    }
                    if (data) {
                        if (usernameElem) {
                            usernameElem.textContent = data.username || "User";
                            usernameElem.style.display = "block";
                        }
                        if (roleElem) {
                            roleElem.textContent = data.role || "Role";
                            roleElem.style.display = "block";
                        }
                        if (profileImg && data.avatar_url) {
                            profileImg.src = data.avatar_url;
                            profileImg.style.display = "block";
                        }
                    }
                    updateUserMenuDisplay();
                });
        } else {
            loggedInMenu.style.display = "none";
            loggedOutMenu.style.display = "block";
            updateUserMenuDisplay();
        }
    });

    logoutBtn.addEventListener("click", async () => {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        } else {
            // Place the line here
            localStorage.removeItem('rememberMe');
            window.location.reload();
        }
    });
    
    }
);
