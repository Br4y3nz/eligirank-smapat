import supabase from '../Supabase/client.js';

async function signUp() {
  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = iti.getNumber();

  const errorMessageEl = document.getElementById('error-message');
  errorMessageEl.style.display = 'none';
  errorMessageEl.textContent = '';

  // Basic validation
  if (!fullName || !username || !email || !password || !phone) {
    errorMessageEl.textContent = 'Harap isi semua bidang!';
    errorMessageEl.style.display = 'block';
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorMessageEl.textContent = 'Format email tidak valid.';
    errorMessageEl.style.display = 'block';
    return;
  }

  // Password length validation
  if (password.length < 8) {
    errorMessageEl.textContent = 'Password harus minimal 8 karakter.';
    errorMessageEl.style.display = 'block';
    return;
  }

  // Phone number validation
  if (!iti.isValidNumber()) {
    errorMessageEl.textContent = 'Nomor telepon tidak valid.';
    errorMessageEl.style.display = 'block';
    return;
  }

  try {
    // Step 1: Sign up the user with email, password, and user metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: fullName,
          phone: phone,
        },
      },
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      errorMessageEl.textContent = `Pendaftaran gagal: ${authError.message}`;
      errorMessageEl.style.display = 'block';
      return;
    }

    // Ensure the user is created before proceeding
    if (!authData.user) {
      errorMessageEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
      errorMessageEl.style.display = 'block';
      return;
    }

    console.log('Auth User ID:', authData.user.id);

    // Step 2: Insert additional user details into the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id, // Ensure this matches auth.uid()
          full_name: fullName,
          username: username,
          email: email,
          phone: phone,
          role_id: null, // Role will be assigned later
        },
      ]);

    if (profileError) {
      console.error('Profile Error:', profileError.message);
      errorMessageEl.textContent = `Gagal menyimpan data pengguna: ${profileError.message}. Namun, email verifikasi telah dikirim. Silakan cek email kamu.`;
      errorMessageEl.style.display = 'block';
      return;
    }

    // Success
    showSuccessModal('Registrasi berhasil! Silakan cek email untuk verifikasi.');
  } catch (error) {
    console.error('Unexpected Error:', error);
    errorMessageEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    errorMessageEl.style.display = 'block';
  }
}

document.getElementById('registrationForm').addEventListener('submit', function (e) {
  e.preventDefault();
  signUp();
});

// Google Sign-Up Button Logic
const googleSignUpBtn = document.getElementById('google-signup-btn');

googleSignUpBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  // After successful OAuth sign-in, get the user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Check if username and phone exist in profiles
    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('username, phone')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profileData || !profileData.username || !profileData.phone) {
      // Missing username or phone, prompt user to complete profile
      alert('Please complete your profile by providing username and phone number.');
      // Here you can redirect to a profile completion page or show a modal/form
      // For simplicity, redirect to a profile completion page (e.g., profile.html)
      window.location.href = 'profile.html';
      return;
    }

    // Upsert user profile data if profile exists and is complete
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata.full_name || user.user_metadata.name || '',
      username: profileData.username,
      email: user.email,
      phone: profileData.phone,
      role_id: null,
    });
    if (upsertError) {
      alert('Error saving profile data: ' + upsertError.message);
    }
  }
});


const phoneInput = document.querySelector("#phone");
const iti = window.intlTelInput(phoneInput, {
  initialCountry: "id",
  preferredCountries: ["id", "us", "gb", "jp"],
  separateDialCode: true,
});

function validatePhoneNumber() {
  if (!iti.isValidNumber()) {
    showErrorModal("Nomor telepon tidak valid.");
    return false;
  }
  return true;
}

// Modal helper functions (assumed to be defined elsewhere)
function showErrorModal(message) {
  const modal = document.getElementById('registrationErrorModal');
  modal.querySelector('p').textContent = message;
  modal.classList.add('show');

  // Add event listener to close modal on outside click
  function outsideClickListener(event) {
    if (!modal.querySelector('.modal-content').contains(event.target)) {
      closeRegistrationErrorModal();
      document.removeEventListener('click', outsideClickListener);
    }
  }
  setTimeout(() => {
    document.addEventListener('click', outsideClickListener);
  }, 0);
}

function showSuccessModal(message) {
  const modal = document.getElementById('registrationSuccessModal');
  modal.querySelector('p').textContent = message;
  modal.classList.add('show');

  // Add event listener to close modal on outside click
  function outsideClickListener(event) {
    if (!modal.querySelector('.modal-content').contains(event.target)) {
      closeRegistrationSuccessModal();
      document.removeEventListener('click', outsideClickListener);
    }
  }
  setTimeout(() => {
    document.addEventListener('click', outsideClickListener);
  }, 0);
}

function closeRegistrationErrorModal() {
  const modal = document.getElementById('registrationErrorModal');
  modal.classList.remove('show');
}

function closeRegistrationSuccessModal() {
  const modal = document.getElementById('registrationSuccessModal');
  modal.classList.remove('show');
}

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
