import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase client
const supabaseUrl = SUPABASE_URL;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  async function signUp() {
    const fullName = document.getElementById('fullName')?.value;
    const username = document.getElementById('username')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const phone = document.getElementById('phone')?.value;

    if (password && password.length < 8) {
      showErrorModal('Password harus minimal 8 karakter.');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: fullName?.trim(),
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

  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function (e) {
      e.preventDefault();
      signUp();
    });
  }

  // Sidebar toggle functionality adapted from temp_sidebar_repo/script.js
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('btn');
  const searchBtn = document.querySelector('.bx-search');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      menuBtnChange();
    });
  }

  if (searchBtn && sidebar) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      menuBtnChange();
    });
  }

  function menuBtnChange() {
    if (sidebar.classList.contains('open')) {
      toggleBtn.classList.replace('bx-menu', 'bx-menu-alt-right');
    } else {
      toggleBtn.classList.replace('bx-menu-alt-right', 'bx-menu');
    }
  }

  menuBtnChange();

  // Dark Mode Toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    // Load saved preference
    const savedTheme = localStorage.getItem('darkModeEnabled');
    if (savedTheme === 'true') {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkModeEnabled', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkModeEnabled', 'false');
      }
    });
  }

  // Slider functionality for "Informasi Terbaru"
  const sliderWrapper = document.querySelector('.slider-wrapper');
  const prevArrow = document.querySelector('.prev-arrow');
  const nextArrow = document.querySelector('.next-arrow');
  const sliderDotsContainer = document.querySelector('.slider-dots');

  if (sliderWrapper && prevArrow && nextArrow && sliderDotsContainer) {
    const slides = sliderWrapper.children;
    const totalSlides = slides.length;
    let currentIndex = 0;

    // Create dots
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.classList.add('slider-dot');
      if (i === 0) dot.classList.add('active');
      dot.dataset.index = i;
      sliderDotsContainer.appendChild(dot);

      dot.addEventListener('click', () => {
        currentIndex = i;
        updateSlider();
      });
    }

    function updateSlider() {
      sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
      // Update dots
      const dots = sliderDotsContainer.querySelectorAll('.slider-dot');
      dots.forEach(dot => dot.classList.remove('active'));
      dots[currentIndex].classList.add('active');
    }

    prevArrow.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlider();
    });

    nextArrow.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlider();
    });
  }

  // Modal functions
  function showModal(message) {
    const modal = document.getElementById('notificationModal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) {
      modalMessage.textContent = message;
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
    }
  }

  function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal) => {
      modal.style.display = 'none';
    });
  }

  function showSuccessModal(message) {
    const modal = document.getElementById('registrationSuccessModal');
    if (modal) {
      modal.querySelector('p').textContent = message;
      modal.style.display = 'block';
    }
  }

  function showErrorModal(message) {
    const modal = document.getElementById('registrationErrorModal');
    if (modal) {
      modal.querySelector('p').textContent = message;
      modal.style.display = 'block';
    }
  }
});
