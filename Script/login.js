import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/+esm';

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function login() {
const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
  const password = document.getElementById('password').value;
  const errorMessageEl = document.getElementById('loginErrorModal').querySelector('p');
  const successMessageEl = document.getElementById('loginSuccessModal').querySelector('p');

  // Hide modals initially
  closeLoginErrorModal();
  closeLoginSuccessModal();

  if (!usernameOrEmail || !password) {
    errorMessageEl.textContent = 'Username atau Email dan password tidak boleh kosong.';
    showLoginErrorModal();
    return;
  }

  try {
    let email = displayName;

    // If input does not contain '@', treat as display name and fetch email
  if (!usernameOrEmail.includes('@')) {
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('email, user_metadata')
      .eq('user_metadata->>username', usernameOrEmail)
      .single();

      if (userError || !user) {
        errorMessageEl.textContent = 'Display Name tidak ditemukan.';
        showLoginErrorModal();
        return;
      }

      email = user.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      errorMessageEl.textContent = 'Login gagal: ' + error.message;
      showLoginErrorModal();
      return;
    }

    successMessageEl.textContent = 'Login berhasil! Selamat datang kembali.';
    showLoginSuccessModal();

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  } catch (error) {
    errorMessageEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    showLoginErrorModal();
  }
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  login();
});

// Google login button handler
const googleLoginBtn = document.getElementById('google-signin-btn');
googleLoginBtn.addEventListener('click', async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard.html',
      },
    });
    if (error) {
      alert('Login dengan Google gagal: ' + error.message);
    }
  } catch (error) {
    alert('Terjadi kesalahan saat login dengan Google.');
  }
});

// Show/hide password toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  if (type === 'password') {
    togglePassword.classList.remove('bx-show');
    togglePassword.classList.add('bx-low-vision');
  } else {
    togglePassword.classList.remove('bx-low-vision');
    togglePassword.classList.add('bx-show');
  }
});

// Modal helper functions
function showLoginErrorModal() {
  const modal = document.getElementById('loginErrorModal');
  modal.style.display = 'flex';
}

function closeLoginErrorModal() {
  const modal = document.getElementById('loginErrorModal');
  modal.style.display = 'none';
}

function showLoginSuccessModal() {
  const modal = document.getElementById('loginSuccessModal');
  modal.style.display = 'flex';
}

function closeLoginSuccessModal() {
  const modal = document.getElementById('loginSuccessModal');
  modal.style.display = 'none';
}

// Close modals on outside click
window.addEventListener('click', (event) => {
  const errorModal = document.getElementById('loginErrorModal');
  const successModal = document.getElementById('loginSuccessModal');
  if (event.target === errorModal) {
    closeLoginErrorModal();
  }
  if (event.target === successModal) {
    closeLoginSuccessModal();
  }
});
