document.addEventListener("DOMContentLoaded", () => {
    let sidebar = document.querySelector(".sidebar");
    let closeBtn = document.querySelector("#btn");
    let searchBtn = document.querySelector(".bx-search");

    closeBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        menuBtnChange();
        updateUserMenuDisplay();
    });

    searchBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        menuBtnChange();
        updateUserMenuDisplay();
    });

    function menuBtnChange() {
        if (sidebar.classList.contains("open")) {
            closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
        } else {
            closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
        }
    }

    menuBtnChange();

    const userInfoContainer = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const loggedInMenu = document.getElementById('logged-in-menu');
    const loggedOutMenu = document.getElementById('logged-out-menu');

    function updateUserMenuDisplay() {
        if (!loggedInMenu.style.display || loggedInMenu.style.display === 'none') {
            // User not logged in, show only login button
            loggedOutMenu.style.display = 'block';
            loggedInMenu.style.display = 'none';
            return;
        }

        if (sidebar.classList.contains('open')) {
            // Sidebar open: show username, role, and logout button
            if (userInfoContainer) userInfoContainer.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        } else {
            // Sidebar closed: show only logout button
            if (userInfoContainer) userInfoContainer.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        }
    }

    // Use global supabase object from window
    window.supabase.auth.getSession().then((session) => {
        if (session && session.data.session) {
            // User is logged in, show profile information
            loggedInMenu.style.display = 'flex';
            loggedOutMenu.style.display = 'none';

            // Get the user's data from Supabase
            window.supabase
                .from('users')
                .select('username, role')
                .eq('id', session.data.session.user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching user data:', error);
                        return;
                    }
                    // Update the username and role in the sidebar
                    if (data) {
                        document.getElementById('username').textContent = data.username || '';
                        document.getElementById('role').textContent = data.role || '';
                    }
                    updateUserMenuDisplay();
                });
        } else {
            // User is not logged in, show login button
            loggedInMenu.style.display = 'none';
            loggedOutMenu.style.display = 'block';
            updateUserMenuDisplay();
        }
    });
});
