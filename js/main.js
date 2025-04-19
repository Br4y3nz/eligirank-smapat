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

function closeRegistrationSuccessModal() {
  document.getElementById('registrationSuccessModal').style.display = 'none';
}

function closeRegistrationErrorModal() {
  document.getElementById('registrationErrorModal').style.display = 'none';
}

function showSuccessModal(message) {
  const modal = document.getElementById('registrationSuccessModal');
  modal.querySelector('p').textContent = message;
  modal.style.display = 'block';
}

function showErrorModal(message) {
  const modal = document.getElementById('registrationErrorModal');
  modal.querySelector('p').textContent = message;
  modal.style.display = 'block';
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

// Theme switch functionality
const themeToggle = document.getElementById('themeToggle');

// Save the theme preference to localStorage when toggled
themeToggle.addEventListener('change', function () {
  const isDarkMode = themeToggle.checked;
  document.body.classList.toggle('dark-mode', isDarkMode);
  const currentTheme = isDarkMode ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Save the theme preference to localStorage
  localStorage.setItem('theme', currentTheme);
});

// Initialize the theme on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light if no theme is saved
  const isDarkMode = savedTheme === 'dark';

  // Apply the saved theme
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Set the toggle state
  themeToggle.checked = isDarkMode;
});

async function signUp() {
  const fullName = document.getElementById('fullName').value;
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value;

  if (password.length < 8) {
    showErrorModal('Password harus minimal 8 karakter.');
    return;
  }

  try {
    // Step 1: Sign up the user with email, password, and user metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: fullName.trim(),
          phone: phone,
        },
      },
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      showErrorModal(`Pendaftaran gagal: ${authError.message}`);
      return;
    }

    // Ensure the user is created before proceeding
    if (!authData.user) {
      showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
      return;
    }

    console.log('Auth User ID:', authData.user.id);

    // Success
    showSuccessModal('Registrasi berhasil! Silakan cek email untuk verifikasi.');
  } catch (error) {
    console.error('Unexpected Error:', error);
    showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
  }
}

document.getElementById('registrationForm').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent the page from refreshing

  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!fullName || !username || !email || !password || !phone) {
    showErrorModal('Semua field wajib diisi.');
    return;
  }

  if (password.length < 8) {
    showErrorModal('Password harus minimal 8 karakter.');
    return;
  }

  try {
    // Step 1: Sign up the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: fullName,
          username: username,
          phone: phone,
        },
      },
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      showErrorModal(`Pendaftaran gagal: ${authError.message}`);
      return;
    }

    // Ensure the user is created before proceeding
    if (!authData.user) {
      showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
      return;
    }

    console.log('User created:', authData.user);

    // Show success modal
    showSuccessModal('Registrasi berhasil! Silakan cek email untuk verifikasi.');
  } catch (error) {
    console.error('Unexpected Error:', error);
    showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
  }
});

<div class="theme-switch">
  <input type="checkbox" id="themeToggle" />
  <label for="themeToggle"></label>
</div>

