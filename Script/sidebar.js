// sidebar.js
import supabase from './Supabase/client.js';

supabase.auth.getSession().then((session) => {
    if (session && session.data.session) {
        // User is logged in, show logged-in-menu
        document.getElementById('logged-out-menu').style.display = 'none';
        document.getElementById('logged-in-menu').style.display = 'block';

        // Get the user's data from Supabase
        supabase
            .from('users')
            .select('username, role')
            .eq('id', session.data.session.user.id)
            .single()
            .then((data) => {
                // Update the username and role in the sidebar
                document.getElementById('username').innerHTML = data.username;
                document.getElementById('role').innerHTML = data.role;
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
            });

        // Add event listener to logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            supabase.auth.signOut().then(() => {
                // User is logged out, show logged-out-menu
                document.getElementById('logged-out-menu').style.display = 'block';
                document.getElementById('logged-in-menu').style.display = 'none';
            });
        });
    } else {
        // User is not logged in, show logged-out-menu
        document.getElementById('logged-out-menu').style.display = 'block';
        document.getElementById('logged-in-menu').style.display = 'none';
    }
});

// Add event listener to sidebar toggle button
document.getElementById('btn').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('sidebar-open');
});

// Add event listener to overlay
document.getElementById('overlay').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('sidebar-open');
});