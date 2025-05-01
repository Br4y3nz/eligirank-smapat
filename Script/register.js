import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/+esm';

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';
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
      showErrorModal(`Gagal menyimpan data pengguna: ${profileError.message}. Namun, email verifikasi telah dikirim. Silakan cek email kamu.`);
      return;
    }

    // Success
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

// Google Sign-Up Button Logic
const googleSignUpBtn = document.getElementById('google-signup-btn');

googleSignUpBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) {
    alert('Error: ' + error.message);
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
  modal.style.display = 'block';
}

function showSuccessModal(message) {
  const modal = document.getElementById('registrationSuccessModal');
  modal.querySelector('p').textContent = message;
  modal.style.display = 'block';
}

function closeRegistrationErrorModal() {
  document.getElementById('registrationErrorModal').style.display = 'none';
}

function closeRegistrationSuccessModal() {
  document.getElementById('registrationSuccessModal').style.display = 'none';
}
