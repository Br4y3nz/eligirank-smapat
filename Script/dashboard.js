import supabase from '../Supabase/client.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  loadUsername();
  loadStats();
  renderAnnouncements();
  renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
  // Removed initVMGSlider call as VMG section is removed
});

// Load username from Supabase profiles table
async function loadUsername() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error("No session or session error:", sessionError);
      document.getElementById('dashboard-username').textContent = "Guest";
      return;
    }
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profileData?.username) {
      console.error("Error fetching username:", error);
      document.getElementById('dashboard-username').textContent = "User";
      return;
    }

    document.getElementById('dashboard-username').textContent = profileData.username;
  } catch (err) {
    console.error("Unexpected error loading username:", err);
    document.getElementById('dashboard-username').textContent = "User";
  }
}

// Save profile data from modal
document.addEventListener('DOMContentLoaded', () => {
  const userInfoForm = document.getElementById('user-info-form');
  if (userInfoForm) {
    userInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('username-input');
      const phoneInput = document.getElementById('phone-input');

      const username = usernameInput?.value.trim();
      const phone = phoneInput?.value.trim();

      if (!username) {
        alert('Username is required.');
        return;
      }
      if (!phone) {
        alert('Phone number is required.');
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          alert('You must be logged in to save your profile.');
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            username: username,
            phone: phone,
          }, { onConflict: 'id' });

        if (error) {
          alert('Failed to save profile: ' + error.message);
          console.error('Profile save error:', error);
          return;
        }

        alert('Profile saved successfully!');
        // Close modal and overlay
        const userInfoModal = document.getElementById('user-info-modal');
        const overlay = document.getElementById('overlay');
        if (userInfoModal && overlay) {
          userInfoModal.classList.remove('open');
          userInfoModal.classList.add('close');
          overlay.classList.remove('open');
          overlay.classList.add('close');
        }
        // Optionally reload or update UI
        loadUsername();
      } catch (err) {
        alert('Unexpected error saving profile.');
        console.error('Unexpected error:', err);
      }
    });
  }
});

// Load stats - mock implementation
async function loadStats() {
  const stats = {
    siswa: 120,
    guru: 15,
    prestasi: 30,
    organisasi: 5,
  };

  document.getElementById('stat-siswa').setAttribute('data-count', stats.siswa);
  document.getElementById('stat-guru').setAttribute('data-count', stats.guru);
  document.getElementById('stat-prestasi').setAttribute('data-count', stats.prestasi);
  document.getElementById('stat-organisasi').setAttribute('data-count', stats.organisasi);

  // Initialize with 0
  document.querySelector('#stat-siswa .stat-value').textContent = '0';
  document.querySelector('#stat-guru .stat-value').textContent = '0';
  document.querySelector('#stat-prestasi .stat-value').textContent = '0';
  document.querySelector('#stat-organisasi .stat-value').textContent = '0';
}

// Animate numbers on scroll into view
function animateNumber(el, count) {
  let current = 0;
  const step = Math.ceil(count / 50);
  const valueEl = el.querySelector('.stat-value');
  const interval = setInterval(() => {
    current += step;
    if (current >= count) {
      valueEl.textContent = count;
      clearInterval(interval);
    } else {
      valueEl.textContent = current;
    }
  }, 20);
}

function animateStatsOnScroll() {
  const stats = document.querySelectorAll('.stat-card');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const count = parseInt(el.getAttribute('data-count'), 10);
        if (!isNaN(count)) {
          animateNumber(el, count);
        }
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

// Scroll fade animation
function observeScrollFade() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-fade').forEach(el => observer.observe(el));
}

function renderTopSiswa() {
  const topSiswaDiv = document.getElementById('top-siswa');
  topSiswaDiv.innerHTML = `
    <h3>Top Siswa Semester Lalu</h3>
    <ul>
      <li>Rina Putri</li>
      <li>Agus Santoso</li>
      <li>Dewi Lestari</li>
    </ul>
  `;
}

function renderAnnouncements() {
  const announcements = [
    { title: 'Libur sekolah tanggal 1 Mei', date: '2025-01-01' },
    { title: 'Jadwal ujian semester', date: '2025-02-15' },
    { title: 'Kegiatan ekstrakurikuler', date: '2025-03-20' },
    { title: 'Pengumuman tambahan 1', date: '2025-04-10' },
    { title: 'Pengumuman tambahan 2', date: '2025-05-05' }
  ];

  const container = document.getElementById("announcement-list");
  container.innerHTML = "";

  announcements.forEach(item => {
    const card = document.createElement("div");
    card.className = "announcement-card";

    const title = document.createElement("h4");
    title.textContent = item.title;

    const date = document.createElement("span");
    const formattedDate = new Date(item.date).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });

    date.textContent = formattedDate;

    card.appendChild(title);
    card.appendChild(date);
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  renderAnnouncements();
  renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
  // Removed initVMGSlider call as VMG section is removed
});

// Render chart for average student scores per class using Chart.js
function renderChart() {
  // Load Chart.js dynamically if not already loaded
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => drawChart();
    document.head.appendChild(script);
  } else {
    drawChart();
  }
}

function drawChart() {
  const canvas = document.getElementById('chart-nilai-canvas');
  if (!canvas) {
    console.error('Chart canvas element not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Mock data for average scores per class
  const data = {
    labels: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    datasets: [{
      label: 'Nilai Rata-rata',
      data: [78, 85, 82],
      backgroundColor: 'rgba(37, 99, 235, 0.6)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 1,
      borderRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: data,
    options: options
  });
}
