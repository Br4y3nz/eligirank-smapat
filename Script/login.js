import supabase from '../Supabase/client.js';

// Wait until window.supabaseClient.auth is ready (polling with timeout)
async function ensureAuthClientReady(timeoutMs = 5000) {
  const start = Date.now();
  const interval = 100;
  while (Date.now() - start < timeoutMs) {
    if (
      window.supabaseClient &&
      window.supabaseClient.auth &&
      typeof window.supabaseClient.auth.getUser === 'function'
    ) {
      return; // ready
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('Supabase AuthClient not ready after timeout');
}

async function login() {
  await ensureAuthClientReady(5000);

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
    let email = usernameOrEmail;

    // If input does not contain '@', treat as username and fetch email from profiles table
    if (!usernameOrEmail.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile by username:', profileError);
        errorMessageEl.textContent = 'Terjadi kesalahan saat mencari username.';
        showLoginErrorModal();
        return;
      }

      if (!profile || !profile.email) {
        errorMessageEl.textContent = 'Display Name tidak ditemukan.';
        showLoginErrorModal();
        return;
      }

      email = profile.email;
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
    console.error('Unexpected login error:', error);
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
    await ensureAuthClientReady(5000);
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
    alert('Terjadi kesalahan saat login dengan Google: ' + (error.message || error));
  }
});

// Show/hide password toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
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
}

// Modal helper functions
function showLoginErrorModal() {
  const modal = document.getElementById('loginErrorModal');
  if (modal) modal.style.display = 'flex';
}

function closeLoginErrorModal() {
  const modal = document.getElementById('loginErrorModal');
  if (modal) modal.style.display = 'none';
}

function showLoginSuccessModal() {
  const modal = document.getElementById('loginSuccessModal');
  if (modal) modal.style.display = 'flex';
}

function closeLoginSuccessModal() {
  const modal = document.getElementById('loginSuccessModal');
  if (modal) modal.style.display = 'none';
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
