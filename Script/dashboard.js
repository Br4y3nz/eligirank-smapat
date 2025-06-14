// dashboard.js - dynamic content for dashboard page

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  loadAnnouncements();
  observeScrollFade();
  animateStatsOnScroll();
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
  document.getElementById('stat-siswa').textContent = `Siswa: 0`;
  document.getElementById('stat-guru').textContent = `Guru: 0`;
  document.getElementById('stat-prestasi').textContent = `Prestasi: 0`;
  document.getElementById('stat-organisasi').textContent = `Organisasi: 0`;
}

// Animate numbers on scroll into view
function animateNumber(el, count) {
  let current = 0;
  const step = Math.ceil(count / 50);
  const interval = setInterval(() => {
    current += step;
    if (current >= count) {
      el.textContent = `${el.id.replace('stat-', '')}: ${count}`;
      clearInterval(interval);
    } else {
      el.textContent = `${el.id.replace('stat-', '')}: ${current}`;
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

// Load announcements - mock implementation
async function loadAnnouncements() {
  const announcements = [
    { title: "Pengumuman 1: Libur sekolah tanggal 1 Mei" },
    { title: "Pengumuman 2: Jadwal ujian semester" },
    { title: "Pengumuman 3: Kegiatan ekstrakurikuler" },
  ];

  const list = document.getElementById('announcement-list');
  list.innerHTML = '';

  announcements.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title;
    list.appendChild(li);
  });
}
