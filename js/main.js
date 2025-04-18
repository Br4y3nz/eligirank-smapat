// Sidebar Toggle Function
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

// Close Sidebar When Clicking Outside
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
});

// Dark Mode Toggle Function
function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                document.documentElement.setAttribute('data-theme', 'light');
            }
        });
    }
}

// Initialize Dark Mode on Page Load
document.addEventListener('DOMContentLoaded', function() {
    setupDarkModeToggle();
});

// Modal functions
function showModal(message) {
    const modal = document.getElementById('notificationModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'flex'; // Change to flex for centering
    modal.style.justifyContent = 'center'; // Center horizontally
    modal.style.alignItems = 'center'; // Center vertically
}

function closeModal() {
    console.log('closeModal function triggered'); // Debugging log
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal) => {
        modal.style.display = 'none';
    });
}

// Ensure the close button works for both modals
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Form validation and submission for login
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    let valid = true;

    // Validate Username
    const username = this.username;
    if (!username.value.trim()) {
        showModal('Username/email wajib diisi.');
        valid = false;
    }
    else if (username.value.length < 3) {
        showModal('Username/email minimal 3 karakter.');
        valid = false;
    } else if (username.value.length > 20) {
        showModal('Username/email maksimal 20 karakter.');
        valid = false;
    } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(username.value) && !/^[a-zA-Z0-9_.+-]+$/.test(username.value)) {
        showModal('Format username/email tidak valid.');
        valid = false;
    }
    ``

    // Validate Password
    const password = this.password;
    if (!password.value.trim()) {
        showModal('Kata sandi wajib diisi.');
        valid = false;
    }

    if (!valid) return;

    // Simulate login process and show modal for messages
    const usernameInput = username.value.trim().toLowerCase();
    const passwordInput = password.value;

    // Simulate network delay
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => 
            (u.username.toLowerCase() === usernameInput || u.email.toLowerCase() === usernameInput) && 
            u.password === passwordInput
        );

        if (!user) {
            showModal('Username/email atau password salah');
            return;
        }

        // Set session
        localStorage.setItem('currentUser', user.username);
        showModal('Login Berhasil! Selamat di EligiRank SMAPAT.');
    }, 1000);
});

// Form validation and submission for registration
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Registration validation logic here...
});

