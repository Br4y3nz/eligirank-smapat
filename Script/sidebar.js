    import supabase from '../Supabase/client.js';

export function initializeSidebar() {
    
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#sidebar-toggle");
    const loggedInMenu = document.getElementById("logged-in-menu");
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

    // Ensure toggle button is visible and enabled for all users
    closeBtn.style.display = "";
    closeBtn.disabled = false;

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

    // Logout button event listener
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
    }

    // Sidebar toggle button click handler without debug logs
    if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        if (!sidebar) {
            console.error("Sidebar element not found on toggle");
            return;
        }
        const isOpen = sidebar.classList.toggle("open");

        closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

        closeBtn.style.transition = "opacity 0.3s ease";
        closeBtn.style.opacity = "0";

        setTimeout(() => {
            if (sidebar.classList.contains("open")) {
                closeBtn.classList.remove("bx-menu");
                closeBtn.classList.add("bx-menu-alt-right");
                document.body.classList.add('sidebar-open');
                document.body.classList.remove('sidebar-closed');
            } else {
                closeBtn.classList.remove("bx-menu-alt-right");
                closeBtn.classList.add("bx-menu");
                document.body.classList.add('sidebar-closed');
                document.body.classList.remove('sidebar-open');
            }
            closeBtn.style.opacity = "1";

            if (isOpen) {
                closeBtn.classList.add("btn-slide");
            }
        }, 300);
    });
    }

    // Remove debug: Log sidebar open/close state changes
    if (sidebar) {
        // No longer logging sidebar class changes
    }

    function toggleVisibility(element, show) {
        if (!element) return;
        element.style.display = show ? "" : "none";
        element.style.visibility = show ? "visible" : "hidden";
        console.log(`toggleVisibility: element id=${element.id}, show=${show}`);
    }

    async function fetchUserData(session) {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("username, phone, avatar_url")
                .eq("id", session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("Error fetching user data:", profileError);
                return null;
            }
            console.log("Fetched profile data:", profileData);
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

        // Always show sidebar nav and links regardless of login state
        const sidebarNav = document.getElementById("sidebar-menu");
        if (sidebarNav) {
            sidebarNav.style.display = "block";
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        console.log("updateUserMenuDisplay: session =", session);

        if (session) {
            toggleVisibility(loggedInMenu, true);
            toggleVisibility(loggedOutMenu, false);

            console.log("updateUserMenuDisplay: Showing logged-in menu, hiding logged-out menu");

            // Set visibility visible to prevent flicker
            loggedInMenu.style.visibility = 'visible';
            loggedOutMenu.style.visibility = 'hidden';

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

                // Show modal if username or phone missing
                if (!profileData.username || !profileData.phone) {
                    const userInfoModal = document.getElementById("user-info-modal");
                    const overlay = document.getElementById("overlay");
                    if (userInfoModal && overlay) {
                        userInfoModal.style.display = "block";
                        overlay.style.display = "block";
                    }
                }

                const profileImg = document.getElementById("profile-img");
                const defaultUserIcon = document.querySelector(".default-user-icon");
                if (profileImg) {
                    if (profileData.avatar_url && profileData.avatar_url.trim() !== "") {
                        // If avatar_url is a bucket path, get public URL from Supabase storage
                        const { data: publicUrlData, error: publicUrlError } = await supabase.storage
                            .from('avatars') // replace 'avatars' with your bucket name if different
                            .getPublicUrl(profileData.avatar_url);

                        if (publicUrlError) {
                            console.error("Error getting public URL for avatar:", publicUrlError);
                            profileImg.src = profileData.avatar_url; // fallback to stored value
                        } else {
                            profileImg.src = publicUrlData.publicUrl;
                        }
                        profileImg.style.display = "block";
                        if (defaultUserIcon) {
                            defaultUserIcon.style.display = "none";
                        }
                        profileImg.style.width = "40px";
                        profileImg.style.height = "40px";
                        profileImg.style.borderRadius = "50%";
                        profileImg.style.objectFit = "cover";
                    } else {
                        // No avatar_url, show default profile icon
                        profileImg.style.display = "none";
                        if (defaultUserIcon) {
                            defaultUserIcon.style.display = "block";
                        }
                    }
                }

            const roleData = await fetchUserRole(session);
            if (roleData && roleElem) {
                if (session.user.id === ADMIN_UID) {
                    roleElem.innerHTML = '<span class="role-badge role-admin" title="Admin" aria-label="Admin role">Admin</span>';
                    roleElem.style.cursor = "default";
                } else if (roleData.length === 1 && roleData[0].role) {
                    const roleText = roleData[0].role.toLowerCase();
                    const capitalizedRole = roleText.charAt(0).toUpperCase() + roleText.slice(1);
                    roleElem.innerHTML = `<span class="role-badge role-${roleText}" title="${capitalizedRole}" aria-label="${capitalizedRole} role">${capitalizedRole}</span>`;
                    roleElem.style.cursor = "default";
                } else {
                    roleElem.innerHTML = '<span class="role-badge role-unset" title="Select Role" aria-label="Select role">Select Role</span>';
                    roleElem.style.cursor = "pointer";
                }
            }

        } else {
            toggleVisibility(loggedInMenu, false);
            toggleVisibility(loggedOutMenu, true);

            console.log("updateUserMenuDisplay: loggedInMenu hidden, loggedOutMenu visible");

            // Set visibility visible to prevent flicker
            loggedInMenu.style.visibility = 'hidden';
            loggedOutMenu.style.visibility = 'visible';

            if (logoutBtn) {
                logoutBtn.style.display = "none";
            }
        }
    }

    // New function to wait for session readiness before updating UI
    async function waitForSessionThenUpdate() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Session fetch error:", error);
            return;
        }

        if (!session) {
            // No session yet, check again after short delay
            setTimeout(waitForSessionThenUpdate, 200);
        } else {
            updateUserMenuDisplay();
        }
    }

    // Call waitForSessionThenUpdate on sidebar load
    waitForSessionThenUpdate();

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

    // Modal close buttons
    const closeUserInfoModalBtn = document.getElementById("close-user-info-modal");
    const closeRoleModalBtn = document.getElementById("close-role-modal");
    const userInfoModal = document.getElementById("user-info-modal");
    const roleModal = document.getElementById("role-modal");
    const overlay = document.getElementById("overlay");

    if (closeUserInfoModalBtn) {
        closeUserInfoModalBtn.onclick = () => {
            if (userInfoModal && overlay) {
                userInfoModal.style.display = "none";
                overlay.style.display = "none";
            }
        };
    }

    if (closeRoleModalBtn) {
        closeRoleModalBtn.onclick = () => {
            if (roleModal && overlay) {
                roleModal.style.display = "none";
                overlay.style.display = "none";
            }
        };
    }

    // Show fields based on selected role in role modal
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

        // Get the logged-in session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!session || sessionError) {
          console.error("Session fetch failed:", sessionError);
          alert("You're not logged in.");
          return;
        }

        const userId = session.user.id;

        // Use upsert to insert/update user profile safely
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
        document.getElementById("user-info-modal").style.display = "none";
        document.getElementById("overlay").style.display = "none";

        // Instead of full reload, update sidebar user data
        if (typeof updateUserMenuDisplay === 'function') {
          updateUserMenuDisplay();
        }
      });
    }

    // Submit role form
    const roleForm = document.getElementById("role-form");
    if (roleForm) {
        roleForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = document.querySelector('input[name="role"]:checked')?.value;
            if (!role) {
                alert("Please select a role.");
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            const updateData = { role };

            if (role === "student") {
                updateData.nisn = document.getElementById("nisn")?.value.trim() || null;
                updateData.nis = document.getElementById("nis")?.value.trim() || null;
            } else if (role === "teacher") {
                updateData.nik = document.getElementById("nik")?.value.trim() || null;
                updateData.nuptk = document.getElementById("nuptk")?.value.trim() || null;
            }

            console.log("Upserting roles with data:", updateData);
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

    closeBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        waitForSessionThenUpdate();

        closeBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

        closeBtn.style.transition = "opacity 0.3s ease";
        closeBtn.style.opacity = "0";

        setTimeout(() => {
            if (sidebar.classList.contains("open")) {
                closeBtn.classList.remove("bx-menu");
                closeBtn.classList.add("bx-menu-alt-right");
                document.body.classList.add('sidebar-open');
                document.body.classList.remove('sidebar-closed');
            } else {
                closeBtn.classList.remove("bx-menu-alt-right");
                closeBtn.classList.add("bx-menu");
                document.body.classList.add('sidebar-closed');
                document.body.classList.remove('sidebar-open');
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
                waitForSessionThenUpdate();
                setTimeout(() => {
                    searchInput.focus();
                }, 300);
            }
        });
    }

    }
}

window.initializeSidebar = initializeSidebar;
