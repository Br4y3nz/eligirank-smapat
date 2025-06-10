import supabase from '../Supabase/client.js';

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

  // Removed sidebar toggle code to avoid duplication with sidebar.js

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

  // Modal functions (to be refactored into reusable utilities)

  // Toggle profile menu visibility based on authentication state
  const loggedInMenu = document.getElementById('logged-in-menu');
  const loggedOutMenu = document.getElementById('logged-out-menu');

  // Function to update profile menu visibility
  function updateProfileMenuVisibility(isLoggedIn) {
    if (isLoggedIn) {
      loggedInMenu.style.display = 'flex';
      loggedOutMenu.style.display = 'none';
    } else {
      loggedInMenu.style.display = 'none';
      loggedOutMenu.style.display = 'flex';
    }
  }

  // Check user session or authentication state
  supabase.auth.getSession().then(({ data: { session } }) => {
    updateProfileMenuVisibility(!!session);
  });

  // Listen for auth state changes to update profile menu visibility
  supabase.auth.onAuthStateChange((event, session) => {
    updateProfileMenuVisibility(!!session);
  });
});
