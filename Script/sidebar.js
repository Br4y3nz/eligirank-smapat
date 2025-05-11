
import supabase from '../Supabase/client.js';

export function initializeSidebar() {
    console.log("initializeSidebar called");
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#btn");
    const loggedInMenu = document.getElementById("logged-in-menu");
    const loggedOutMenu = document.getElementById("logged-out-menu");
    const usernameElem = document.getElementById("username");
    const roleElem = document.getElementById("role");
    const logoutBtn = document.getElementById("log_out");
    const ADMIN_UID = "632455ea-c4e1-42f7-9955-b361dffa8e6d";

    if (!sidebar || !closeBtn) {
        console.error("Sidebar or close button not found in DOM");
        return;
    }

    function toggleVisibility(element, show) {
        if (!element) return;
        if (show) {
            element.classList.add("visible");
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
            element.classList.remove("visible");
        }
    }

    function updateUserMenuDisplay() {
        if (!loggedInMenu || !loggedOutMenu) {
            console.error("Logged in/out menu elements not found");
            return;
        }

        if (loggedInMenu.classList.contains("hidden") || !loggedInMenu.classList.contains("visible")) {
            loggedOutMenu.classList.add("visible");
            loggedOutMenu.classList.remove("hidden");
            loggedInMenu.classList.add("hidden");
            loggedInMenu.classList.remove("visible");

            if (sidebar.classList.contains("open")) {
                loggedOutMenu.classList.add("open");
            } else {
                loggedOutMenu.classList.remove("open");
            }

            toggleVisibility(usernameElem, false);
            toggleVisibility(roleElem, false);
            const userIcon = document.getElementById("default-user-icon");
            toggleVisibility(userIcon, false);
            toggleVisibility(logoutBtn, false);

            const profileDetails = loggedInMenu.querySelector(".profile-details");
            if (profileDetails) {
                profileDetails.classList.add("hidden");
                profileDetails.classList.remove("visible");
            }
            const loginProfileDetails = loggedOutMenu.querySelector(".login-profile-details");
            if (loginProfileDetails) {
                loginProfileDetails.classList.add("visible");
                loginProfileDetails.classList.remove("hidden");
            }
            return;
        }

        const profileDetails = loggedInMenu.querySelector(".profile-details");
        const loginProfileDetails = loggedOutMenu.querySelector(".login-profile-details");

        if (sidebar.classList.contains("open")) {
            toggleVisibility(usernameElem, true);
            toggleVisibility(roleElem, true);
            const userIcon = document.getElementById("default-user-icon");
            toggleVisibility(userIcon, true);
            toggleVisibility(logoutBtn, true);

            if (profileDetails) {
                profileDetails.classList.add("visible");
                profileDetails.classList.remove("hidden");
            }
            if (loginProfileDetails) {
                loginProfileDetails.classList.add("visible");
                loginProfileDetails.classList.remove("hidden");
            }
        } else {
            toggleVisibility(usernameElem, false);
            toggleVisibility(roleElem, false);
            const userIcon = document.getElementById("default-user-icon");
            toggleVisibility(userIcon, false);
            toggleVisibility(logoutBtn, false);

            if (profileDetails) {
                profileDetails.classList.add("hidden");
                profileDetails.classList.remove("visible");
            }
            if (loginProfileDetails) {
                loginProfileDetails.classList.add("visible");
                loginProfileDetails.classList.remove("hidden");
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

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
        const session = sessionData?.session;
        if (session) {
            loggedInMenu.classList.add("visible");
            loggedInMenu.classList.remove("hidden");
            loggedOutMenu.classList.add("hidden");
            loggedOutMenu.classList.remove("visible");

            const profileData = await fetchUserData(session);
            if (profileData && (!profileData.username || !profileData.phone)) {
                const userInfoModal = document.getElementById("user-info-modal");
                const overlayElem = document.getElementById("overlay");
                if (userInfoModal && overlayElem) {
                    userInfoModal.style.display = "block";
                    overlayElem.style.display = "block";
                }
            }

            if (usernameElem) {
                usernameElem.textContent = profileData?.username || "User";
                toggleVisibility(usernameElem, true);
            }

            let userIcon = document.getElementById("default-user-icon");
            if (!userIcon) {
                userIcon = document.createElement("i");
                userIcon.id = "default-user-icon";
                userIcon.className = "bx bx-user-circle default-user-icon";
                const profileContainer = document.querySelector(".sidebar li.profile");
                if (profileContainer) {
                    profileContainer.insertBefore(userIcon, profileContainer.firstChild);
                }
            }
            toggleVisibility(userIcon, true);
            userIcon.style.fontSize = "45px";
            userIcon.style.color = "#FACC15";
            userIcon.style.width = "45px";
            userIcon.style.height = "45px";
            userIcon.style.alignItems = "center";
            userIcon.style.justifyContent = "center";
            userIcon.style.marginRight = "10px";
            userIcon.style.cursor = "pointer";

            const roleData = await fetchUserRole(session);
            if (roleData === null) {
                if (roleElem) {
                    roleElem.innerHTML = '<span class="role-badge">Select role</span>';
                    roleElem.style.cursor = "pointer";
                }
            } else {
                if (session.user.id === ADMIN_UID) {
                    if (roleElem) {
                        roleElem.innerHTML = '<span class="role-badge role-admin">Admin</span>';
                        roleElem.style.cursor = "default";
                    }
                } else if (roleData.length === 1 && roleData[0].role) {
                    if (roleElem) {
                        const roleText = roleData[0].role;
                        const capitalizedRole = roleText.charAt(0).toUpperCase() + roleText.slice(1).toLowerCase();
                        roleElem.innerHTML = `<span class="role-badge">${capitalizedRole}</span>`;
                    }
                } else {
                    if (roleElem) {
                        roleElem.innerHTML = '<span class="role-badge">Select role</span>';
                    }
                }
            }

            updateUserMenuDisplay();
        } else {
            loggedInMenu.classList.add("hidden");
            loggedInMenu.classList.remove("visible");
            loggedOutMenu.classList.add("visible");
            loggedOutMenu.classList.remove("hidden");
            updateUserMenuDisplay();
        }
    });

    logoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        } else {
            localStorage.removeItem("rememberMe");
            window.location.href = "index.html";
        }
    });

    const roleModal = document.getElementById("role-modal");
    const overlay = document.getElementById("overlay");
    const roleForm = document.getElementById("role-form");
    const closeModalBtn = document.getElementById("close-role-modal");

    function openRoleModal() {
        roleModal.style.display = "block";
        overlay.style.display = "block";
    }

    function closeRoleModal() {
        roleModal.style.display = "none";
        overlay.style.display = "none";
    }

    if (roleElem) {
        roleElem.addEventListener("click", () => {
            if (roleElem.textContent === "Select role") {
                openRoleModal();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeRoleModal);
    }

    overlay.addEventListener("click", closeRoleModal);

    roleForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(roleForm);
        const role = formData.get("role");

        try {
            const session = await supabase.auth.getSession().then(({ data }) => data?.session);
            if (!session) {
                alert("You must be logged in to set a role.");
                return;
            }

            const userId = session.user.id;

            const { error } = await supabase
                .from("roles")
                .upsert({ user_id: userId, role }, { onConflict: "user_id" });

            if (error) {
                console.error("Error saving role:", error);
                alert("Failed to save role. Please try again.");
                return;
            }

            roleElem.textContent = role;
            closeRoleModal();
        } catch (error) {
            console.error("Error during role save:", error);
            alert("An error occurred. Please try again.");
        }
    });
}