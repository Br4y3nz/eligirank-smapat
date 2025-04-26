// Initialize Supabase client
  const supabaseUrl = `https://yauwsxvgjmmyleheclpi.supabase.co`; // Replace with your Supabase project URL
  const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY`;
  const supabase = createClient(supabaseUrl, supabaseKey);

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

      console.log('User created:', authData.user);
      showSuccessModal('Registrasi berhasil! Silakan cek email untuk verifikasi.');
    } catch (error) {
      console.error('Unexpected Error:', error);
      showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
    }
  }

  document.getElementById('registrationForm').addEventListener('submit', function (e) {
    e.preventDefault();
    signUp();
  });


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

// Removed duplicate dark mode toggle setup and replaced with unified theme toggle logic below

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

// Unified theme toggle logic with renamed variable to avoid redeclaration errors
const darkModeToggle = document.getElementById('darkModeToggle');

function applyTheme(theme) {
  const isDarkMode = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.documentElement.setAttribute('data-theme', theme);
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
  }
  // Also toggle dark-mode class on hero section for welcome speech dark mode
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    heroSection.classList.toggle('dark-mode', isDarkMode);
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
});

// Save theme preference on toggle
if (darkModeToggle) {
  darkModeToggle.addEventListener('change', () => {
    const theme = darkModeToggle.checked ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  });
}

// Supabase client initialization - renamed variables to avoid redeclaration errors
const supabaseUrlClient = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseAnonKeyClient = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';
const supabaseClient = supabase.createClient(supabaseUrlClient, supabaseAnonKeyClient);

// Google sign-in button handler
document.addEventListener('DOMContentLoaded', () => {
  const googleSignInBtn = document.getElementById('google-signup-btn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) {
        alert('Error: ' + error.message);
      }
    });
  }
});

// Optional: listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log('User logged in:', session.user.email);
    // Redirect or update UI accordingly
  }
});
