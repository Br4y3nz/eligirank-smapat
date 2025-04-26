import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/+esm';

// Initialize Supabase client
const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co'; // Replace with your Supabase project URL
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

    if (!authData.user) {
      showErrorModal('Terjadi kesalahan. Silakan coba lagi.');
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

// Modal functions
function showModal(message) {
  const modal = document.getElementById('notificationModal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = message;
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
}

function closeModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach((modal) => {
    modal.style.display = 'none';
  });
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

// Additional functions and event listeners can be added here as needed

// Export functions if needed (optional)
// export { signUp, toggleSidebar, closeModal, showSuccessModal, showErrorModal };
