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

    supabase.auth.getSession().then(({ data: sessionData }) => {
        const session = sessionData?.session;
        console.log('Session:', session);
        console.log('Logged-in menu element:', loggedInMenu);
        console.log('Logged-out menu element:', loggedOutMenu);

        if (session) {
            loggedInMenu.style.display = "flex";
            loggedOutMenu.style.display = "none";

            supabase
                .from("profiles")
                .select("username, role, avatar_url")
                .eq("user_id", session.user.id)
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
                            // Check if user is admin by UID
                            if (session.user.id === ADMIN_UID) {
                                roleElem.textContent = "admin";
                            } else {
                                roleElem.textContent = data.role || "Role";
                            }
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
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        } else {
            // Place the line here
            localStorage.removeItem('rememberMe');
            window.location.reload();
        }
    });

    // Add auth state change listener to handle session expiration and sign out
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED' || event === 'USER_DELETED') {
            // Clear any session-related local storage or UI state
            localStorage.removeItem('rememberMe');
            // Optionally redirect to login page or show a message
            alert('Your session has expired or you have been signed out. Please log in again.');
            window.location.href = '/register.html'; // Adjust the path to your login page
        }
    });
    
    }
);


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
