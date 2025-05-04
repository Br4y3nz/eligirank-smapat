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

            // Hide profile details and logout button when not logged in
            if (usernameElem) usernameElem.style.display = "none";
            if (roleElem) roleElem.style.display = "none";
            if (profileImg) profileImg.style.display = "none";
            const userIcon = document.getElementById("default-user-icon");
            if (userIcon) userIcon.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";

            // Also hide profile-details container opacity and pointer-events
            const profileDetails = loggedInMenu.querySelector(".profile-details");
            if (profileDetails) {
                profileDetails.style.opacity = "0";
                profileDetails.style.pointerEvents = "none";
            }

            return;
        }

        const profileDetails = loggedInMenu.querySelector(".profile-details");

        if (sidebar.classList.contains("open")) {
            // Sidebar open and logged in: show username, role, user icon, and logout button
            if (usernameElem) usernameElem.style.display = "block";
            if (roleElem) roleElem.style.display = "block";
            const userIcon = document.getElementById("default-user-icon");
            if (userIcon) userIcon.style.display = "inline-flex";
            if (profileImg) profileImg.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "inline-flex";

            // Show profile-details container
            if (profileDetails) {
                profileDetails.style.opacity = "1";
                profileDetails.style.pointerEvents = "auto";
            }
        } else {
            // Sidebar closed or logged in: hide username, role, user icon, and logout button; show collapsed profile image
            if (usernameElem) usernameElem.style.display = "none";
            if (roleElem) roleElem.style.display = "none";
            const userIcon = document.getElementById("default-user-icon");
            if (userIcon) userIcon.style.display = "none";
            if (profileImg) {
                profileImg.style.display = "block";
                profileImg.classList.add("collapsed-pfp");
            }
            if (logoutBtn) logoutBtn.style.display = "none";

            // Hide profile-details container
            if (profileDetails) {
                profileDetails.style.opacity = "0";
                profileDetails.style.pointerEvents = "none";
            }
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
                    .select("username, phone")
                    .eq("id", session.user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error("Error fetching user data:", profileError);
                } else {
                    // Check if username or phone is missing, show modal if so
                    if (!profileData || !profileData.username || !profileData.phone) {
                        const userInfoModal = document.getElementById("user-info-modal");
                        const overlayElem = document.getElementById("overlay");
                        if (userInfoModal && overlayElem) {
                            userInfoModal.style.display = "block";
                            overlayElem.style.display = "block";
                        }
                    }

                    if (usernameElem) {
                        usernameElem.textContent = (profileData && profileData.username) ? profileData.username : "User";
                        usernameElem.style.display = "block";
                        if (!usernameElem.textContent || usernameElem.textContent.trim() === "") {
                            usernameElem.textContent = "User";
                        }
                    }
                    if (profileImg) {
                        // Replace default profile picture with user circle icon from Boxicons
                        profileImg.style.display = "none"; // hide img element
                        // Insert user circle icon element if not already present
                        let userIcon = document.getElementById("default-user-icon");
                        if (!userIcon) {
                            userIcon = document.createElement("i");
                            userIcon.id = "default-user-icon";
                            userIcon.className = "bx bx-user-circle default-user-icon";
                            profileImg.parentNode.insertBefore(userIcon, profileImg);
                        }
                        userIcon.style.display = "block";
                        // Ensure userIcon is visible and has correct styles
                        userIcon.style.fontSize = "45px";
                        userIcon.style.color = "#FACC15";
                        userIcon.style.width = "45px";
                        userIcon.style.height = "45px";
                        userIcon.style.display = "inline-flex";
                        userIcon.style.alignItems = "center";
                        userIcon.style.justifyContent = "center";
                        userIcon.style.marginRight = "10px";
                        userIcon.style.cursor = "pointer";
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
                } else {
                    // Override role to "admin" if user ID matches admin UID
                    if (session.user.id === ADMIN_UID) {
                        if (roleElem) {
                            roleElem.textContent = "admin";
                            roleElem.style.cursor = "default";
                        }
                    } else if (roleData && roleData.length === 1 && roleData[0].role) {
                        if (roleElem) {
                            roleElem.textContent = roleData[0].role;
                            roleElem.style.cursor = "default";
                            if (!roleElem.textContent || roleElem.textContent.trim() === "") {
                                roleElem.textContent = "Select role";
                                roleElem.style.cursor = "pointer";
                            }
                        }
                    } else {
                        if (roleElem) {
                            roleElem.textContent = "Select role";
                            roleElem.style.cursor = "pointer";
                        }
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
            window.location.href = "index.html";
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

// User info modal logic
const userInfoModal = document.getElementById("user-info-modal");
const userInfoForm = document.getElementById("user-info-form");
const closeUserInfoModalBtn = document.getElementById("close-user-info-modal");
const overlayElem = document.getElementById("overlay");

if (closeUserInfoModalBtn) {
    closeUserInfoModalBtn.addEventListener("click", () => {
        if (userInfoModal && overlayElem) {
            userInfoModal.style.display = "none";
            overlayElem.style.display = "none";
        }
    });
}

if (userInfoForm) {
    userInfoForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const usernameInput = document.getElementById("username-input");
        const phoneInput = document.getElementById("phone-input");

        if (!usernameInput.value || !phoneInput.value) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("You must be logged in to update your profile.");
                return;
            }
            const userId = session.user.id;

            const { error } = await supabase
                .from("profiles")
                .update({
                    username: usernameInput.value,
                    phone: phoneInput.value
                })
                .eq("id", userId);

            if (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile. Please try again.");
                return;
            }

            // Update sidebar username display
            const usernameElem = document.getElementById("username");
            if (usernameElem) {
                usernameElem.textContent = usernameInput.value;
            }

            // Close modal and overlay
            if (userInfoModal && overlayElem) {
                userInfoModal.style.display = "none";
                overlayElem.style.display = "none";
            }
        } catch (error) {
            console.error("Error during profile update:", error);
            alert("An error occurred. Please try again.");
        }
    });
}


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
